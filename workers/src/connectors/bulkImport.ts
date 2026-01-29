import { gunzipSync, strFromU8, unzipSync } from "fflate";
import { XMLParser } from "fast-xml-parser";
import Papa from "papaparse";
import type { Env, ExclusionRule, FundingSource, OpportunityRecord, SourceIntegrationType } from "../types";
import { agencyPriorityBoost, buildAgencyFilters, isAgencyExcluded, scoreKeywords } from "../filters";
import { hashText, normalizeText } from "../utils";
import { politeFetch } from "./http";
import type { BulkParsingProfile, FieldMap } from "../sources/types";

// Default Profile
const DEFAULT_PARSING: BulkParsingProfile = {
  // ... (keep same defaults)
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
  csvKeys: {
    id: ["id", "reference_number", "notice_id", "solicitation_number"],
    title: ["title", "title_en", "project_title", "solicitation_name"],
    summary: ["description", "description_en", "summary"],
    agency: ["agency", "organization", "department", "buyer"],
    status: ["status", "notice_status", "stage"],
    url: ["url", "link", "notice_url"],
    postedDate: ["date_published", "posted_date", "publication_date"],
    dueDate: ["date_closing", "closing_date", "deadline"]
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

  const contentLength = Number(response.headers.get("content-length"));
  if (contentLength > 50 * 1024 * 1024) { 
    throw new Error(`File too large (${(contentLength / 1024 / 1024).toFixed(2)}MB)`);
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
  const xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    isArray: (name, jpath, isLeafNode, isAttribute) => false // Don't force arrays everywhere
  });

  const processEntries = async (entries: any[], keys: FieldMap, filename: string) => {
    for (const entry of entries) {
      if (records.length >= maxNotices) break;
      const record = await buildRecord(entry, source, filters, filename, keys, profile);
      pushRecord(record);
    }
  };

  const handleXml = async (xml: string, filename: string) => {
    try {
      const jsonObj = xmlParser.parse(xml);
      const entries = extractJsonEntries(jsonObj); // Re-use JSON traversal logic
      const keys = profile.xmlTags ?? DEFAULT_PARSING.xmlTags;
      await processEntries(entries, keys, filename);
    } catch (e) {
      console.warn(`XML parse error in ${filename}: ${e}`);
    }
  };

  const handleJson = async (json: unknown, filename: string) => {
    const entries = extractJsonEntries(json);
    const keys = profile.jsonKeys ?? DEFAULT_PARSING.jsonKeys;
    await processEntries(entries, keys, filename);
  };

  const handleCsv = async (csv: string, filename: string) => {
    const result = Papa.parse(csv, { header: true, skipEmptyLines: true });
    if (result.errors.length > 0) {
      console.warn(`CSV parse warnings in ${filename}:`, result.errors[0]);
    }
    const keys = profile.csvKeys ?? DEFAULT_PARSING.csvKeys ?? DEFAULT_PARSING.jsonKeys;
    await processEntries(result.data, keys, filename);
  };

  try {
    if (extension === "zip" || contentType.includes("zip")) {
      const entries = unzipSync(buffer);
      for (const [filename, data] of Object.entries(entries)) {
        if (records.length >= maxNotices) break;
        if (!data || data.length === 0) continue;
        await parsePayload(strFromU8(data), filename, handleXml, handleJson, handleCsv);
      }
    } else if (extension === "gz" || contentType.includes("gzip")) {
      const decompressed = gunzipSync(buffer);
      if (decompressed && decompressed.length > 0) {
        await parsePayload(strFromU8(decompressed), url, handleXml, handleJson, handleCsv);
      }
    } else {
      if (buffer.length > 0) {
        await parsePayload(strFromU8(buffer), url, handleXml, handleJson, handleCsv);
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
  handleJson: (json: unknown, filename: string) => Promise<void>,
  handleCsv: (csv: string, filename: string) => Promise<void>
): Promise<void> {
  const trimmed = payload.trim();
  if (!trimmed) return;

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const json = JSON.parse(trimmed);
      await handleJson(json, filename);
      return;
    } catch {} // Ignore JSON parse errors and fall through
  }

  if (trimmed.startsWith("<") || trimmed.includes("<?xml")) {
    await handleXml(trimmed, filename);
    return;
  }

  // Fallback to CSV
  await handleCsv(trimmed, filename);
}

// Unified Record Builder
async function buildRecord(
  entry: any,
  source: FundingSource,
  filters: { priorityAgencies: string[]; excludedBureaus: string[] },
  filename: string,
  keys: FieldMap,
  profile: BulkParsingProfile
): Promise<OpportunityRecord | null> {
  const rawString = JSON.stringify(entry);
  
  const title = pickString(entry, keys.title) ?? "Untitled Tender";
  const url = pickString(entry, keys.url);
  const agency = pickString(entry, keys.agency) ?? pickPath(entry, profile.jsonPaths?.agency ?? DEFAULT_PARSING.jsonPaths?.agency ?? []);

  const rawId = pickString(entry, keys.id);
  const fallbackSource = url || (title.length > 5 ? `${title}|${agency ?? ""}` : rawString);
  const opportunityId = rawId ?? `SRC-${(await hashText(fallbackSource)).slice(0, 12)}`;

  const summary = pickString(entry, keys.summary);
  const status = pickString(entry, keys.status);
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
    versionHash: await hashText(rawString),
    rawPayload: { file: filename, ...entry } // Keep original structure
  };
}

function extractJsonEntries(data: unknown): Array<any> {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === "object" && data !== null) {
    const record = data as Record<string, unknown>;
    for (const key of ["items", "results", "data", "records", "tenders", "notices", "opportunities", "releases", "awards", "contracts", "TenderNotice", "List"]) {
      // Check for nested XML-converted arrays (e.g. root.TenderNotice[])
      if (Array.isArray(record[key])) return record[key] as Array<any>;
      // Handle nested object that contains array? (e.g. data: { items: [] })
      if (record[key] && typeof record[key] === "object") {
         const nested = extractJsonEntries(record[key]);
         if (nested.length > 0) return nested;
      }
    }
    // If no array found but it's an object, treat as single entry? 
    // Or maybe the keys are indices?
    return [record];
  }
  return [];
}

function pickString(entry: any, keys: string[]): string | null {
  if (!keys) return null;
  for (const key of keys) {
    const value = entry[key] ?? entry[key.toLowerCase()]; // Case insensitive lookup
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
    if (typeof value === "number") return String(value);
    if (typeof value === "object" && value && "#text" in value) return value["#text"]; // fast-xml-parser text node
  }
  return null;
}

function pickPath(entry: any, paths: string[]): string | null {
  for (const path of paths) {
    const value = getPath(entry, path.split("."));
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return null;
}

function getPath(entry: any, path: string[]): unknown {
  let current = entry;
  for (const segment of path) {
    if (!current || typeof current !== "object") return null;
    current = current[segment];
  }
  return current;
}

export function isBulkType(integrationType: SourceIntegrationType): boolean {
  return ["bulk_xml_zip", "bulk_xml", "bulk_json", "bulk_csv", "manual_url"].includes(integrationType);
}

function mergeProfile(profile?: BulkParsingProfile): BulkParsingProfile {
  if (!profile) return DEFAULT_PARSING;
  return {
    entryTags: profile.entryTags ?? DEFAULT_PARSING.entryTags,
    xmlTags: { ...DEFAULT_PARSING.xmlTags, ...profile.xmlTags },
    jsonKeys: { ...DEFAULT_PARSING.jsonKeys, ...profile.jsonKeys },
    csvKeys: { ...DEFAULT_PARSING.csvKeys, ...profile.csvKeys },
    jsonPaths: {
      agency: profile.jsonPaths?.agency ?? DEFAULT_PARSING.jsonPaths?.agency
    }
  };
}