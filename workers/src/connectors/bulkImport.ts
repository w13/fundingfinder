import { gunzipSync, strFromU8, unzipSync } from "fflate";
import type { Env, ExclusionRule, FundingSource, OpportunityRecord, SourceIntegrationType } from "../types";
import { agencyPriorityBoost, buildAgencyFilters, isAgencyExcluded, scoreKeywords } from "../filters";
import { hashText, normalizeText } from "../utils";
import { politeFetch } from "./http";

const ENTRY_TAGS = ["NOTICE", "TENDER", "CONTRACT_NOTICE", "CONTRACT", "PROCUREMENT", "FORM_SECTION", "OPPORTUNITY", "RECORD"];
const ID_TAGS = ["NOTICE_ID", "NOTICE_NUMBER", "OCID", "ID", "REFERENCE", "REF_NO", "REFNO", "REFERENCE_NUMBER"];
const TITLE_TAGS = ["TITLE", "TITLE_EN", "TITLE_TE", "CONTRACT_TITLE", "TENDER_TITLE", "SUBJECT", "OBJECT"];
const SUMMARY_TAGS = ["SHORT_DESCR", "DESCRIPTION", "CONTRACT_OBJECT", "OBJECT_DESCR", "SUMMARY"];
const AGENCY_TAGS = ["CONTRACTING_BODY", "OFFICIALNAME", "ORGANISATION_NAME", "AGENCY", "BUYER_NAME", "PROCURING_ENTITY"];
const STATUS_TAGS = ["NOTICE_TYPE", "STATUS", "TYPE_OF_CONTRACT", "PROCEDURE", "CATEGORY"];
const URL_TAGS = ["URI_DOC", "URL", "URL_DOCUMENT", "NOTICE_URL", "DETAIL_URL"];
const POSTED_TAGS = ["DATE_DISPATCH_NOTICE", "DATE_DISPATCH", "PUBLISHED_DATE", "DATE_PUB", "DATE_PUBLICATION"];
const DUE_TAGS = ["DATE_RECEIPT_TENDERS", "DATE_RECEIPT_REQUESTS", "DEADLINE", "DATE_TENDER", "DATE_CLOSING"];

const JSON_KEYS = {
  id: ["id", "noticeId", "tenderId", "ocid", "reference", "refNo", "referenceNumber", "documentNumber"],
  title: ["title", "noticeTitle", "tenderTitle", "contractTitle", "name", "subject", "object"],
  summary: ["summary", "description", "shortDescription", "shortDescr", "objectDescription"],
  agency: ["agency", "buyer", "procuringEntity", "contractingAuthority", "organization", "issuer"],
  status: ["status", "noticeType", "procedure", "stage"],
  url: ["url", "link", "noticeUrl", "detailUrl", "portalUrl"],
  postedDate: ["postedDate", "publishDate", "publicationDate", "datePublished", "dateReleased"],
  dueDate: ["dueDate", "deadline", "closingDate", "dateClosing", "dateTenders"]
};

const JSON_PATHS = {
  agency: ["buyer.name", "procuringEntity.name", "organization.name", "agency.name", "issuer.name"]
};

export interface BulkImportOptions {
  url?: string;
  maxNotices?: number;
}

export async function syncBulkSource(
  env: Env,
  ctx: ExecutionContext,
  source: FundingSource,
  rules: ExclusionRule[],
  options: BulkImportOptions
): Promise<OpportunityRecord[]> {
  const maxNotices = options.maxNotices ?? Number(env.BULK_MAX_NOTICES ?? env.TED_MAX_NOTICES ?? 500);
  const url = options.url ?? source.autoUrl;
  if (!url) return [];

  const filters = buildAgencyFilters(env.EXCLUDED_BUREAUS, env.PRIORITY_AGENCIES, rules);
  const response = await politeFetch(url, { method: "GET" }, env, ctx);
  if (!response.ok) {
    throw new Error(`Bulk download failed (${response.status})`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const buffer = new Uint8Array(await response.arrayBuffer());
  const extension = getExtension(url);

  const records: OpportunityRecord[] = [];
  const pushRecord = (record: OpportunityRecord | null) => {
    if (!record) return;
    if (isAgencyExcluded(record.agency, filters)) return;
    if (record.keywordScore <= 0) return;
    records.push(record);
  };

  const handleXml = async (xml: string, filename: string) => {
    for (const entry of extractXmlEntries(xml)) {
      if (records.length >= maxNotices) break;
      const record = await buildRecordFromXml(entry, source, filters, filename);
      pushRecord(record);
    }
  };

  const handleJson = async (json: unknown, filename: string) => {
    const entries = extractJsonEntries(json);
    for (const entry of entries) {
      if (records.length >= maxNotices) break;
      const record = await buildRecordFromJson(entry, source, filters, filename);
      pushRecord(record);
    }
  };

  if (extension === "zip" || contentType.includes("zip")) {
    const entries = unzipSync(buffer);
    for (const [filename, data] of Object.entries(entries)) {
      if (records.length >= maxNotices) break;
      await parsePayload(strFromU8(data), filename, handleXml, handleJson);
    }
  } else if (extension === "gz" || contentType.includes("gzip")) {
    await parsePayload(strFromU8(gunzipSync(buffer)), url, handleXml, handleJson);
  } else {
    await parsePayload(strFromU8(buffer), url, handleXml, handleJson);
  }

  return records;
}

function getExtension(url: string): string {
  const match = url.toLowerCase().match(/\\.([a-z0-9]+)(?:\\?|$)/);
  return match ? match[1] : "";
}

async function parsePayload(
  payload: string,
  filename: string,
  handleXml: (xml: string, filename: string) => Promise<void>,
  handleJson: (json: unknown, filename: string) => Promise<void>
): Promise<void> {
  const trimmed = payload.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const json = JSON.parse(trimmed);
      await handleJson(json, filename);
      return;
    } catch (error) {
      console.warn("bulk json parse failed", error);
    }
  }

  await handleXml(trimmed, filename);
}

function extractXmlEntries(xml: string): string[] {
  for (const tag of ENTRY_TAGS) {
    const regex = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi");
    const matches = xml.match(regex);
    if (matches && matches.length > 0) {
      return matches;
    }
  }
  return [xml];
}

async function buildRecordFromXml(
  xml: string,
  source: FundingSource,
  filters: { priorityAgencies: string[]; excludedBureaus: string[] },
  filename: string
): Promise<OpportunityRecord | null> {
  const opportunityId = extractTag(xml, ID_TAGS) ?? `SRC-${(await hashText(xml)).slice(0, 12)}`;
  const title = extractTag(xml, TITLE_TAGS) ?? "Untitled Tender";
  const summary = extractTag(xml, SUMMARY_TAGS);
  const agency = extractTag(xml, AGENCY_TAGS);
  const status = extractTag(xml, STATUS_TAGS);
  const url = extractTag(xml, URL_TAGS);
  const postedDate = extractTag(xml, POSTED_TAGS);
  const dueDate = extractTag(xml, DUE_TAGS);

  const combined = normalizeText(`${title} ${summary ?? ""} ${agency ?? ""}`);
  const keywordScore = scoreKeywords(combined) + agencyPriorityBoost(agency, filters);

  return {
    id: crypto.randomUUID(),
    opportunityId,
    source: source.id,
    title: normalizeText(title),
    agency: agency ? normalizeText(agency) : null,
    bureau: null,
    status: status ? normalizeText(status) : null,
    summary: summary ? normalizeText(summary) : null,
    eligibility: "Open to registered suppliers.",
    forProfitEligible: true,
    smallBusinessEligible: combined.toLowerCase().includes("small business"),
    keywordScore,
    postedDate: postedDate ? normalizeText(postedDate) : null,
    dueDate: dueDate ? normalizeText(dueDate) : null,
    url: url ? normalizeText(url) : source.homepage,
    version: 1,
    versionHash: await hashText(xml),
    rawPayload: { file: filename, opportunityId, title }
  };
}

async function buildRecordFromJson(
  entry: Record<string, unknown>,
  source: FundingSource,
  filters: { priorityAgencies: string[]; excludedBureaus: string[] },
  filename: string
): Promise<OpportunityRecord | null> {
  const jsonString = JSON.stringify(entry);
  const opportunityId = pickString(entry, JSON_KEYS.id) ?? `SRC-${(await hashText(jsonString)).slice(0, 12)}`;
  const title = pickString(entry, JSON_KEYS.title) ?? "Untitled Tender";
  const summary = pickString(entry, JSON_KEYS.summary);
  const agency = pickString(entry, JSON_KEYS.agency) ?? pickPath(entry, JSON_PATHS.agency);
  const status = pickString(entry, JSON_KEYS.status);
  const url = pickString(entry, JSON_KEYS.url);
  const postedDate = pickString(entry, JSON_KEYS.postedDate);
  const dueDate = pickString(entry, JSON_KEYS.dueDate);

  const combined = normalizeText(`${title} ${summary ?? ""} ${agency ?? ""}`);
  const keywordScore = scoreKeywords(combined) + agencyPriorityBoost(agency, filters);

  return {
    id: crypto.randomUUID(),
    opportunityId,
    source: source.id,
    title: normalizeText(title),
    agency: agency ? normalizeText(agency) : null,
    bureau: null,
    status: status ? normalizeText(status) : null,
    summary: summary ? normalizeText(summary) : null,
    eligibility: "Open to registered suppliers.",
    forProfitEligible: true,
    smallBusinessEligible: combined.toLowerCase().includes("small business"),
    keywordScore,
    postedDate: postedDate ? normalizeText(postedDate) : null,
    dueDate: dueDate ? normalizeText(dueDate) : null,
    url: url ? normalizeText(url) : source.homepage,
    version: 1,
    versionHash: await hashText(jsonString),
    rawPayload: { file: filename, opportunityId, title }
  };
}

function extractTag(xml: string, tags: string[]): string | null {
  for (const tag of tags) {
    const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
    if (match?.[1]) {
      return stripXml(match[1]);
    }
  }
  return null;
}

function stripXml(value: string): string {
  return normalizeText(value.replace(/<[^>]+>/g, " "));
}

function extractJsonEntries(data: unknown): Array<Record<string, unknown>> {
  if (!data) return [];
  if (Array.isArray(data)) {
    return data.filter((item) => typeof item === "object" && item !== null) as Array<Record<string, unknown>>;
  }
  if (typeof data === "object") {
    const record = data as Record<string, unknown>;
    for (const key of ["items", "results", "data", "records", "tenders", "notices", "opportunities"]) {
      if (Array.isArray(record[key])) {
        return record[key] as Array<Record<string, unknown>>;
      }
    }
    return [record];
  }
  return [];
}

function pickString(entry: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = entry[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
    if (typeof value === "object" && value && "name" in (value as Record<string, unknown>)) {
      const nested = (value as Record<string, unknown>).name;
      if (typeof nested === "string" && nested.trim().length > 0) {
        return nested.trim();
      }
    }
  }
  return null;
}

function pickPath(entry: Record<string, unknown>, paths: string[]): string | null {
  for (const path of paths) {
    const value = getPath(entry, path.split("."));
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

function getPath(entry: Record<string, unknown>, path: string[]): unknown {
  let current: unknown = entry;
  for (const segment of path) {
    if (!current || typeof current !== "object") return null;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

export function isBulkType(integrationType: SourceIntegrationType): boolean {
  return ["bulk_xml_zip", "bulk_xml", "bulk_json", "manual_url"].includes(integrationType);
}
