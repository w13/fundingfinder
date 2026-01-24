import type { Env, ExclusionRule, OpportunityRecord, PdfJob, SourceSystem } from "../types";
import { buildAgencyFilters, evaluateEligibility, isAgencyExcluded, agencyPriorityBoost, scoreKeywords } from "../filters";
import { hashPayload, normalizeText } from "../utils";
import { politeFetch } from "./http";

const SOURCE: SourceSystem = "hrsa";

export async function syncHrsa(
  env: Env,
  ctx: ExecutionContext,
  rules: ExclusionRule[] = []
): Promise<{ records: OpportunityRecord[]; pdfJobs: PdfJob[] }> {
  const filters = buildAgencyFilters(env.EXCLUDED_BUREAUS, env.PRIORITY_AGENCIES, rules);
  const url = new URL("https://api.hrsa.gov/v1/grants");
  url.searchParams.set("postedWithinDays", "7");

  const response = await politeFetch(
    url,
    {
      method: "GET",
      headers: {
        "X-API-KEY": env.HRSA_API_KEY ?? ""
      }
    },
    env,
    ctx
  );

  if (!response.ok) {
    console.warn("hrsa sync failed", response.status);
    return { records: [], pdfJobs: [] };
  }

  const data = (await response.json()) as Record<string, unknown>;
  const items = extractItems(data);
  const records: OpportunityRecord[] = [];
  const pdfJobs: PdfJob[] = [];

  for (const item of items) {
    const raw = item as Record<string, unknown>;
    const opportunityId = String(raw.opportunityId ?? raw.opportunityNumber ?? raw.id ?? "");
    if (!opportunityId) continue;

    const title = String(raw.title ?? raw.opportunityTitle ?? "Untitled Opportunity");
    const agency = toNullableString(raw.agency ?? "HRSA");
    const bureau = toNullableString(raw.bureau ?? raw.office);
    const status = toNullableString(raw.status ?? raw.openStatus);
    const summary = toNullableString(raw.summary ?? raw.description);
    const eligibility = toNullableString(raw.eligibility ?? raw.eligibilityText);
    const postedDate = toNullableString(raw.postedDate ?? raw.openDate);
    const dueDate = toNullableString(raw.closeDate ?? raw.dueDate);
    const urlValue = toNullableString(raw.url ?? raw.detailsUrl);

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
  const direct = data.opportunities ?? data.results ?? data.data;
  if (Array.isArray(direct)) return direct;
  const nested = (data.data as Record<string, unknown> | undefined)?.opportunities;
  if (Array.isArray(nested)) return nested;
  return [];
}

function extractDocumentUrls(raw: Record<string, unknown>): string[] {
  const urls: string[] = [];
  const docs = raw.documents ?? raw.attachments;
  if (Array.isArray(docs)) {
    for (const doc of docs) {
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
