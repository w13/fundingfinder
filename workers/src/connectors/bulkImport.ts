import { gunzipSync, strFromU8, unzipSync } from "fflate";
import type { Env, ExclusionRule, FundingSource, OpportunityRecord, SourceIntegrationType } from "../types";
import { agencyPriorityBoost, buildAgencyFilters, isAgencyExcluded, scoreKeywords } from "../filters";
import { hashText, normalizeText } from "../utils";
import { politeFetch } from "./http";
import type { BulkParsingProfile } from "../sources/types";

const DEFAULT_PARSING: BulkParsingProfile = {
  entryTags: ["NOTICE", "TENDER", "CONTRACT_NOTICE", "CONTRACT", "PROCUREMENT", "FORM_SECTION", "OPPORTUNITY", "RECORD"],
  xmlTags: {
    id: ["NOTICE_ID", "NOTICE_NUMBER", "OCID", "ID", "REFERENCE", "REF_NO", "REFNO", "REFERENCE_NUMBER"],
    title: ["TITLE", "TITLE_EN", "TITLE_TE", "CONTRACT_TITLE", "TENDER_TITLE", "SUBJECT", "OBJECT"],
    summary: ["SHORT_DESCR", "DESCRIPTION", "CONTRACT_OBJECT", "OBJECT_DESCR", "SUMMARY"],
    agency: ["CONTRACTING_BODY", "OFFICIALNAME", "ORGANISATION_NAME", "AGENCY", "BUYER_NAME", "PROCURING_ENTITY"],
    status: ["NOTICE_TYPE", "STATUS", "TYPE_OF_CONTRACT", "PROCEDURE", "CATEGORY"],
    url: ["URI_DOC", "URL", "URL_DOCUMENT", "NOTICE_URL", "DETAIL_URL"],
    postedDate: ["DATE_DISPATCH_NOTICE", "DATE_DISPATCH", "PUBLISHED_DATE", "DATE_PUB", "DATE_PUBLICATION"],
    dueDate: ["DATE_RECEIPT_TENDERS", "DATE_RECEIPT_REQUESTS", "DEADLINE", "DATE_TENDER", "DATE_CLOSING"]
  },
  jsonKeys: {
    id: ["id", "noticeId", "tenderId", "ocid", "reference", "refNo", "referenceNumber", "documentNumber"],
    title: ["title", "noticeTitle", "tenderTitle", "contractTitle", "name", "subject", "object"],
    summary: ["summary", "description", "shortDescription", "shortDescr", "objectDescription"],
    agency: ["agency", "buyer", "procuringEntity", "contractingAuthority", "organization", "issuer"],
    status: ["status", "noticeType", "procedure", "stage"],
    url: ["url", "link", "noticeUrl", "detailUrl", "portalUrl"],
    postedDate: ["postedDate", "publishDate", "publicationDate", "datePublished", "dateReleased"],
    dueDate: ["dueDate", "deadline", "closingDate", "dateClosing", "dateTenders"]
  },
  jsonPaths: {
    agency: ["buyer.name", "procuringEntity.name", "organization.name", "agency.name", "issuer.name"]
  }
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
  options: BulkImportOptions,
  parsingProfile?: BulkParsingProfile
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

  const profile = mergeProfile(parsingProfile);

  const handleXml = async (xml: string, filename: string) => {
    for (const entry of extractXmlEntries(xml, profile)) {
      if (records.length >= maxNotices) break;
      const record = await buildRecordFromXml(entry, source, filters, filename, profile);
      pushRecord(record);
    }
  };

  const handleJson = async (json: unknown, filename: string) => {
    const entries = extractJsonEntries(json);
    for (const entry of entries) {
      if (records.length >= maxNotices) break;
      const record = await buildRecordFromJson(entry, source, filters, filename, profile);
      pushRecord(record);
    }
  };

  try {
    if (extension === "zip" || contentType.includes("zip")) {
      const entries = unzipSync(buffer);
      for (const [filename, data] of Object.entries(entries)) {
        if (records.length >= maxNotices) break;
        if (!data || data.length === 0) continue;
        try {
          await parsePayload(strFromU8(data), filename, handleXml, handleJson);
        } catch (error) {
          console.warn(`Failed to parse ${filename}:`, error);
          continue;
        }
      }
    } else if (extension === "gz" || contentType.includes("gzip")) {
      const decompressed = gunzipSync(buffer);
      if (decompressed && decompressed.length > 0) {
        await parsePayload(strFromU8(decompressed), url, handleXml, handleJson);
      }
    } else {
      if (buffer.length > 0) {
        await parsePayload(strFromU8(buffer), url, handleXml, handleJson);
      }
    }
  } catch (error) {
    console.error("Bulk import error:", error);
    throw new Error(`Failed to process bulk file: ${error instanceof Error ? error.message : "Unknown error"}`);
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
  if (!payload || payload.trim().length === 0) {
    console.warn(`Empty payload for ${filename}`);
    return;
  }

  const trimmed = payload.trim();
  
  // Try JSON first
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const json = JSON.parse(trimmed);
      if (json !== null && json !== undefined) {
        await handleJson(json, filename);
        return;
      }
    } catch (error) {
      console.warn(`JSON parse failed for ${filename}, trying XML:`, error);
    }
  }

  // Try XML
  if (trimmed.startsWith("<") || trimmed.includes("<?xml")) {
    try {
      await handleXml(trimmed, filename);
      return;
    } catch (error) {
      console.warn(`XML parse failed for ${filename}:`, error);
      throw error;
    }
  }

  console.warn(`Unknown format for ${filename}, skipping`);
}

function extractXmlEntries(xml: string, profile: BulkParsingProfile): string[] {
  for (const tag of profile.entryTags ?? DEFAULT_PARSING.entryTags ?? []) {
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
  filename: string,
  profile: BulkParsingProfile
): Promise<OpportunityRecord | null> {
  const tags = profile.xmlTags ?? DEFAULT_PARSING.xmlTags;
  const opportunityId = extractTag(xml, tags.id) ?? `SRC-${(await hashText(xml)).slice(0, 12)}`;
  const title = extractTag(xml, tags.title) ?? "Untitled Tender";
  const summary = extractTag(xml, tags.summary);
  const agency = extractTag(xml, tags.agency);
  const status = extractTag(xml, tags.status);
  const url = extractTag(xml, tags.url);
  const postedDate = extractTag(xml, tags.postedDate);
  const dueDate = extractTag(xml, tags.dueDate);
  const bureau = tags.bureau ? extractTag(xml, tags.bureau) : null;
  const eligibility = tags.eligibility ? extractTag(xml, tags.eligibility) : null;

  const combined = normalizeText(`${title} ${summary ?? ""} ${agency ?? ""}`);
  const keywordScore = scoreKeywords(combined) + agencyPriorityBoost(agency, filters);

  return {
    id: crypto.randomUUID(),
    opportunityId,
    source: source.id,
    title: normalizeText(title),
    agency: agency ? normalizeText(agency) : null,
    bureau: bureau ? normalizeText(bureau) : null,
    status: status ? normalizeText(status) : null,
    summary: summary ? normalizeText(summary) : null,
    eligibility: eligibility ? normalizeText(eligibility) : "Open to registered suppliers.",
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
  filename: string,
  profile: BulkParsingProfile
): Promise<OpportunityRecord | null> {
  const jsonString = JSON.stringify(entry);
  const keys = profile.jsonKeys ?? DEFAULT_PARSING.jsonKeys;
  const opportunityId = pickString(entry, keys.id) ?? `SRC-${(await hashText(jsonString)).slice(0, 12)}`;
  const title = pickString(entry, keys.title) ?? "Untitled Tender";
  const summary = pickString(entry, keys.summary);
  const agency = pickString(entry, keys.agency) ?? pickPath(entry, profile.jsonPaths?.agency ?? DEFAULT_PARSING.jsonPaths?.agency ?? []);
  const status = pickString(entry, keys.status);
  const url = pickString(entry, keys.url);
  const postedDate = pickString(entry, keys.postedDate);
  const dueDate = pickString(entry, keys.dueDate);
  const bureau = keys.bureau ? pickString(entry, keys.bureau) : null;
  const eligibility = keys.eligibility ? pickString(entry, keys.eligibility) : null;

  const combined = normalizeText(`${title} ${summary ?? ""} ${agency ?? ""}`);
  const keywordScore = scoreKeywords(combined) + agencyPriorityBoost(agency, filters);

  return {
    id: crypto.randomUUID(),
    opportunityId,
    source: source.id,
    title: normalizeText(title),
    agency: agency ? normalizeText(agency) : null,
    bureau: bureau ? normalizeText(bureau) : null,
    status: status ? normalizeText(status) : null,
    summary: summary ? normalizeText(summary) : null,
    eligibility: eligibility ? normalizeText(eligibility) : "Open to registered suppliers.",
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
    // Try with CDATA first
    const cdataMatch = xml.match(new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, "i"));
    if (cdataMatch?.[1]) {
      return normalizeText(cdataMatch[1].trim());
    }
    // Try regular tag
    const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
    if (match?.[1]) {
      return stripXml(match[1]);
    }
    // Try self-closing tag with attribute
    const attrMatch = xml.match(new RegExp(`<${tag}[^>]+(?:title|name|value)=["']([^"']+)["']`, "i"));
    if (attrMatch?.[1]) {
      return normalizeText(attrMatch[1]);
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
    return data.filter((item) => typeof item === "object" && item !== null && !Array.isArray(item)) as Array<Record<string, unknown>>;
  }
  if (typeof data === "object" && data !== null) {
    const record = data as Record<string, unknown>;
    // Try common array keys
    for (const key of ["items", "results", "data", "records", "tenders", "notices", "opportunities", "releases", "awards", "contracts"]) {
      if (Array.isArray(record[key])) {
        const arr = record[key] as unknown[];
        return arr.filter((item) => typeof item === "object" && item !== null && !Array.isArray(item)) as Array<Record<string, unknown>>;
      }
    }
    // If it's a single object, wrap it
    if (!Array.isArray(record)) {
      return [record];
    }
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

function mergeProfile(profile?: BulkParsingProfile): BulkParsingProfile {
  if (!profile) return DEFAULT_PARSING;
  return {
    entryTags: profile.entryTags ?? DEFAULT_PARSING.entryTags,
    xmlTags: { ...DEFAULT_PARSING.xmlTags, ...profile.xmlTags },
    jsonKeys: { ...DEFAULT_PARSING.jsonKeys, ...profile.jsonKeys },
    jsonPaths: {
      agency: profile.jsonPaths?.agency ?? DEFAULT_PARSING.jsonPaths?.agency
    }
  };
}
