import type { Env, ExclusionRule, OpportunityRecord, PdfJob, SourceSystem } from "../types";
import { evaluateEligibility, scoreKeywords, buildAgencyFilters, isAgencyExcluded, agencyPriorityBoost } from "../filters";
import { hashPayload, normalizeText } from "../utils";
import { politeFetch } from "./http";

const SOURCE: SourceSystem = "grants_gov";

export async function syncGrantsGov(
  env: Env,
  ctx: ExecutionContext,
  rules: ExclusionRule[] = []
): Promise<{ records: OpportunityRecord[]; pdfJobs: PdfJob[] }> {
  const now = new Date();
  const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const filters = buildAgencyFilters(env.EXCLUDED_BUREAUS, env.PRIORITY_AGENCIES, rules);

  const payload = {
    startDate: startDate.toISOString().slice(0, 10),
    endDate: now.toISOString().slice(0, 10),
    rows: 100,
    sortBy: "openDate|desc"
  };

  const response = await politeFetch(
    "https://api.grants.gov/v1/api/search2",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": env.GRANTS_GOV_API_KEY ?? ""
      },
      body: JSON.stringify(payload)
    },
    env,
    ctx
  );

  if (!response.ok) {
    console.warn("grants.gov sync failed", response.status);
    return { records: [], pdfJobs: [] };
  }

  const data = (await response.json()) as Record<string, unknown>;
  const items = extractItems(data);
  const records: OpportunityRecord[] = [];
  const pdfJobs: PdfJob[] = [];

  for (const item of items) {
    const raw = item as Record<string, unknown>;
    const opportunityId = String(raw.opportunityId ?? raw.opportunityNumber ?? raw.oppNumber ?? raw.fundingOpportunityNumber ?? "");
    if (!opportunityId) continue;

    const title = String(raw.title ?? raw.opportunityTitle ?? "Untitled Opportunity");
    const agency = toNullableString(raw.agency ?? raw.agencyName ?? raw.fundingAgency ?? raw.agencyCode);
    const bureau = toNullableString(raw.bureau ?? raw.bureauName);
    const status = toNullableString(raw.status ?? raw.opportunityStatus);
    const summary = toNullableString(raw.synopsis ?? raw.description ?? raw.summary);
    const eligibility = toNullableString(raw.eligibility ?? raw.eligibilityInfo);
    const postedDate = toNullableString(raw.postedDate ?? raw.openDate);
    const dueDate = toNullableString(raw.closeDate ?? raw.deadlineDate);
    const url = toNullableString(raw.detailsUrl ?? raw.opportunityLink ?? raw.url);

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
      url,
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
        detailUrl: url,
        documentUrls: extractDocumentUrls(raw)
      });
    }
  }

  return { records, pdfJobs };
}

function extractItems(data: Record<string, unknown>): unknown[] {
  const direct = data.opportunities ?? data.oppHits ?? data.grants ?? data.results;
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
