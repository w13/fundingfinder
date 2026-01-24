import type { Env, ExclusionRule, OpportunityRecord, PdfJob, SourceSystem } from "../types";
import { buildAgencyFilters } from "../filters";
import { politeFetch } from "./http";
import { buildOpportunityRecord } from "../normalize/opportunity";
import { extractSamGovDocuments, mapSamGov } from "../sources/samGov";

const SOURCE: SourceSystem = "sam_gov";

export async function syncSamGov(
  env: Env,
  ctx: ExecutionContext,
  rules: ExclusionRule[] = []
): Promise<{ records: OpportunityRecord[]; pdfJobs: PdfJob[] }> {
  const filters = buildAgencyFilters(env.EXCLUDED_BUREAUS, env.PRIORITY_AGENCIES, rules);
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
    const normalized = mapSamGov(raw);
    if (!normalized) continue;
    const result = await buildOpportunityRecord(normalized, filters);
    if (!result) continue;
    records.push(result.record);
    if (result.eligibleForDeepDive) {
      pdfJobs.push({
        opportunityId: result.record.opportunityId,
        source: SOURCE,
        title: result.record.title,
        detailUrl: result.record.url,
        documentUrls: extractSamGovDocuments(raw)
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
