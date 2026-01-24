import type { Env, ExclusionRule, OpportunityRecord, PdfJob, SourceSystem } from "../types";
import { buildAgencyFilters } from "../filters";
import { politeFetch } from "./http";
import { buildOpportunityRecord } from "../normalize/opportunity";
import { extractHrsaDocuments, mapHrsa } from "../sources/hrsa";

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
    const normalized = mapHrsa(raw);
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
        documentUrls: extractHrsaDocuments(raw)
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
