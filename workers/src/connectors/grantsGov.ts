import type { Env, ExclusionRule, OpportunityRecord, PdfJob, SourceSystem } from "../types";
import { buildAgencyFilters } from "../filters";
import { politeFetch } from "./http";
import { buildOpportunityRecord } from "../normalize/opportunity";
import { extractGrantsGovDocuments, mapGrantsGov } from "../sources/grantsGov";

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
    const normalized = mapGrantsGov(raw);
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
        documentUrls: extractGrantsGovDocuments(raw)
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
