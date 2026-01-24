import { gunzipSync, strFromU8, unzipSync } from "fflate";
import type { Env, ExclusionRule, OpportunityRecord, PdfJob, SourceSystem } from "../types";
import { buildAgencyFilters, agencyPriorityBoost, isAgencyExcluded, scoreKeywords } from "../filters";
import { hashText, normalizeText } from "../utils";
import { politeFetch } from "./http";

const SOURCE: SourceSystem = "ted_eu";
const DEFAULT_INDEX_URL = "https://ted.europa.eu/en/simap/xml-bulk-download";

export interface TedSyncOptions {
  zipUrl?: string;
  maxNotices?: number;
}

export async function syncTedEu(
  env: Env,
  ctx: ExecutionContext,
  rules: ExclusionRule[] = [],
  options: TedSyncOptions = {}
): Promise<{ records: OpportunityRecord[]; pdfJobs: PdfJob[] }> {
  const filters = buildAgencyFilters(env.EXCLUDED_BUREAUS, env.PRIORITY_AGENCIES, rules);
  const maxNotices = options.maxNotices ?? Number(env.TED_MAX_NOTICES ?? 500);

  const zipUrl = options.zipUrl ?? (await resolveLatestZipUrl(env, ctx));
  if (!zipUrl) {
    console.warn("ted.eu sync missing zip url");
    return { records: [], pdfJobs: [] };
  }

  const response = await politeFetch(zipUrl, { method: "GET" }, env, ctx);
  if (!response.ok) {
    console.warn("ted.eu zip fetch failed", response.status);
    return { records: [], pdfJobs: [] };
  }

  const buffer = new Uint8Array(await response.arrayBuffer());
  const entries = unzipSync(buffer);
  const records: OpportunityRecord[] = [];
  let processed = 0;

  for (const [filename, data] of Object.entries(entries)) {
    if (processed >= maxNotices) break;
    const lower = filename.toLowerCase();
    if (!lower.endsWith(".xml") && !lower.endsWith(".xml.gz") && !lower.endsWith(".gz")) {
      continue;
    }

    const xml = lower.endsWith(".gz") ? strFromU8(gunzipSync(data)) : strFromU8(data);
    const notices = extractTedNotices(xml);

    for (const notice of notices) {
      if (processed >= maxNotices) break;
      const parsed = await parseTedNotice(notice, filename);
      if (!parsed) continue;
      if (isAgencyExcluded(parsed.agency, filters)) continue;
      if (parsed.keywordScore <= 0) continue;
      records.push(parsed);
      processed += 1;
    }
  }

  return { records, pdfJobs: [] };
}

async function resolveLatestZipUrl(env: Env, ctx: ExecutionContext): Promise<string | null> {
  const indexUrl = env.TED_BULK_DOWNLOAD_URL ?? DEFAULT_INDEX_URL;
  const response = await politeFetch(indexUrl, { method: "GET" }, env, ctx);
  if (!response.ok) return null;
  const html = await response.text();
  const candidates = extractZipLinks(html);
  if (candidates.length === 0) return null;
  return pickLatestByDate(candidates) ?? candidates[0] ?? null;
}

function extractZipLinks(html: string): string[] {
  const links = new Set<string>();
  const patterns = [
    /href=["']([^"']+\.(zip|gz))["']/gi,
    /(https?:\/\/[^"']+\.(zip|gz))/gi
  ];
  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const url = match[1] ?? match[0];
      if (typeof url === "string") {
        links.add(url.startsWith("http") ? url : new URL(url, DEFAULT_INDEX_URL).toString());
      }
    }
  }
  return Array.from(links);
}

function pickLatestByDate(urls: string[]): string | null {
  let latest: { url: string; stamp: number } | null = null;
  for (const url of urls) {
    const match = url.match(/(20\\d{6})/);
    if (!match) continue;
    const stamp = Number(match[1]);
    if (!latest || stamp > latest.stamp) {
      latest = { url, stamp };
    }
  }
  return latest?.url ?? null;
}

async function parseTedNotice(xml: string, filename: string): Promise<OpportunityRecord | null> {
  const opportunityId =
    extractTag(xml, ["NOTICE_NUMBER_OJ", "TD_DOCUMENT_NUMBER", "NOTICE_NUMBER", "NO_DOC_OJ", "DOCUMENT_NUMBER"]) ??
    `TED-${(await hashText(xml)).slice(0, 12)}`;

  const title =
    extractTag(xml, ["TITLE", "TITLE_EN", "TITLE_TE", "CONTRACT_OBJECT", "SHORT_DESCR", "OBJECT_DESCR"]) ??
    "Untitled Tender";
  const summary = extractTag(xml, ["SHORT_DESCR", "OBJECT_DESCR", "DESCRIPTION", "CONTRACT_OBJECT"]);
  const agency = extractTag(xml, ["OFFICIALNAME", "ORGANISATION_NAME", "CONTRACTING_BODY", "ADDRESS_CONTRACTING_BODY"]);
  const bureau = extractTag(xml, ["NUTS", "NUTS_CODE"]);
  const postedDate = extractTag(xml, ["DATE_DISPATCH_NOTICE", "DATE_DISPATCH", "DATE_PUB", "DATE_PUBLISH"]);
  const dueDate = extractTag(xml, ["DATE_RECEIPT_TENDERS", "DATE_RECEIPT_REQUESTS", "DATE_TENDER"]);
  const status = extractTag(xml, ["NOTICE_TYPE", "TYPE_OF_CONTRACT"]);
  const url = extractTag(xml, ["URI_DOC", "URL_DOCUMENT", "URL"]);

  const combined = normalizeText(`${title} ${summary ?? ""} ${agency ?? ""}`);
  const keywordScore = scoreKeywords(combined) + agencyPriorityBoost(agency, filters);

  return {
    id: crypto.randomUUID(),
    opportunityId,
    source: SOURCE,
    title: normalizeText(title),
    agency: agency ? normalizeText(agency) : null,
    bureau: bureau ? normalizeText(bureau) : null,
    status: status ? normalizeText(status) : null,
    summary: summary ? normalizeText(summary) : null,
    eligibility: "Economic operators, suppliers, and contractors.",
    forProfitEligible: true,
    smallBusinessEligible: combined.toLowerCase().includes("small business"),
    keywordScore,
    postedDate: postedDate ? normalizeText(postedDate) : null,
    dueDate: dueDate ? normalizeText(dueDate) : null,
    url: url ? normalizeText(url) : null,
    version: 1,
    versionHash: await hashText(xml),
    rawPayload: {
      file: filename,
      opportunityId,
      title,
      summary
    }
  };
}

function extractTedNotices(xml: string): string[] {
  const matches = xml.match(/<TED_EXPORT[\\s\\S]*?<\\/TED_EXPORT>/gi);
  if (matches && matches.length > 0) return matches;
  const forms = xml.match(/<FORM_SECTION[\\s\\S]*?<\\/FORM_SECTION>/gi);
  if (forms && forms.length > 0) return forms;
  return [xml];
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
