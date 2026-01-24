import type { Env, OpportunityRecord, PdfJob, SourceSystem } from "../types";
import { buildAgencyFilters, evaluateEligibility, isAgencyExcluded, agencyPriorityBoost, scoreKeywords } from "../filters";
import { hashPayload, normalizeText } from "../utils";
import { politeFetch } from "./http";

const SOURCE: SourceSystem = "sam_gov";

export async function syncSamGov(env: Env, ctx: ExecutionContext): Promise<{ records: OpportunityRecord[]; pdfJobs: PdfJob[] }> {
  const filters = buildAgencyFilters(env.EXCLUDED_BUREAUS, env.PRIORITY_AGENCIES);
  const now = new Date();
  const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const apiKey = env.SAM_GOV_API_KEY ?? "";

  const url = new URL("https://api.sam.gov/opportunities/v2/search");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("postedFrom", startDate.toISOString().slice(0, 10));
  url.searchParams.set("postedTo", now.toISOString().slice(0, 10));
  url.searchParams.set("limit", "100");
  url.searchParams.set("offset", "0");

  const response = await politeFetch(url, { method: "GET" }, env, ctx);
  if (!response.ok) {
    console.warn("sam.gov sync failed", response.status);
    return { records: [], pdfJobs: [] };
  }

  const data = (await response.json()) as Record<string, unknown>;
  const items = extractItems(data);
  const records: OpportunityRecord[] = [];
  const pdfJobs: PdfJob[] = [];

  for (const item of items) {
    const raw = item as Record<string, unknown>;
    const opportunityId = String(raw.noticeId ?? raw.solicitationNumber ?? raw.opportunityId ?? "");
    if (!opportunityId) continue;

    const title = String(raw.title ?? raw.noticeTitle ?? "Untitled Opportunity");
    const agency = toNullableString(raw.departmentName ?? raw.subTier ?? raw.agencyName ?? raw.agency);
    const bureau = toNullableString(raw.office ?? raw.officeName);
    const status = toNullableString(raw.active ?? raw.status ?? raw.responseDeadLine ?? null);
    const summary = toNullableString(raw.description ?? raw.summary ?? raw.synopsis);
    const eligibility = toNullableString(raw.eligibility ?? raw.eligibilityRequirements);
    const postedDate = toNullableString(raw.postedDate ?? raw.publishDate);
    const dueDate = toNullableString(raw.responseDeadLine ?? raw.archiveDate);
    const urlValue = toNullableString(raw.uiLink ?? raw.url ?? raw.noticeUrl);

    if (isAgencyExcluded(agency, filters)) continue;

    const combined = normalizeText(`${title} ${summary ?? ""} ${eligibility ?? ""}`);
    const eligibilityResult = evaluateEligibility(eligibility);
    const keywordScore = scoreKeywords(combined) + agencyPriorityBoost(agency, filters);

    const record: OpportunityRecord = {
      id: crypto.randomUUID(),
      opportunityId,
      source: SOURCE,
      title,
      agency,
      bureau,
      status,
      summary,
      eligibility,
      forProfitEligible: eligibilityResult.forProfitEligible,
      smallBusinessEligible: eligibilityResult.smallBusinessEligible,
      keywordScore,
      postedDate,
      dueDate,
      url: urlValue,
      version: 1,
      versionHash: await hashPayload(raw),
      rawPayload: raw
    };

    records.push(record);

    const passes = eligibilityResult.forProfitEligible && !eligibilityResult.excluded && keywordScore > 0;
    if (passes) {
      pdfJobs.push({
        opportunityId,
        source: SOURCE,
        title,
        detailUrl: urlValue,
        documentUrls: extractDocumentUrls(raw)
      });
    }
  }

  return { records, pdfJobs };
}

function extractItems(data: Record<string, unknown>): unknown[] {
  const direct = data.opportunities ?? data.oppHits ?? data.opportunitiesData ?? data.opportunitiesData?.results;
  if (Array.isArray(direct)) return direct;
  const nested = (data.data as Record<string, unknown> | undefined)?.opportunities;
  if (Array.isArray(nested)) return nested;
  return [];
}

function extractDocumentUrls(raw: Record<string, unknown>): string[] {
  const urls: string[] = [];
  const docs = raw.resourceLinks ?? raw.documents ?? raw.attachments;
  if (Array.isArray(docs)) {
    for (const doc of docs) {
      if (typeof doc === "string" && doc.includes(".pdf")) {
        urls.push(doc);
        continue;
      }
      const url = toNullableString((doc as Record<string, unknown>).url ?? (doc as Record<string, unknown>).href);
      if (url) urls.push(url);
    }
  }
  return urls;
}

function toNullableString(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return null;
}
