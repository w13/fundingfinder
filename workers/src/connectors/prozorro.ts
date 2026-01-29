import type { Env, ExclusionRule, OpportunityRecord, PdfJob } from "../types";
import { buildAgencyFilters } from "../filters";
import { buildOpportunityRecord } from "../normalize/opportunity";
import { politeFetch } from "./http";
import { mapProzorro } from "../sources/prozorro";

export async function syncProzorro(
  env: Env,
  ctx: ExecutionContext,
  rules: ExclusionRule[] = []
): Promise<{ records: OpportunityRecord[]; pdfJobs: PdfJob[] }> {
  const filters = buildAgencyFilters(env.EXCLUDED_BUREAUS, env.PRIORITY_AGENCIES, rules);
  const records: OpportunityRecord[] = [];
  const pdfJobs: PdfJob[] = [];

  try {
    // First, fetch the list of tender IDs
    const listUrl = "https://public.api.openprocurement.org/api/2.5/tenders?descending=1&limit=100";
    const listResponse = await politeFetch(listUrl, { method: "GET" }, env, ctx);

    if (!listResponse.ok) {
      throw new Error(`Prozorro list sync failed: HTTP ${listResponse.status} ${listResponse.statusText}`);
    }

    const listData = await listResponse.json();
    const tenderIds: string[] = [];
    
    if (listData && typeof listData === "object" && "data" in listData && Array.isArray(listData.data)) {
      for (const item of listData.data) {
        if (item && typeof item === "object" && "id" in item && typeof item.id === "string") {
          tenderIds.push(item.id);
        }
      }
    }

    // Fetch full details for each tender (limit to 50 to avoid timeout)
    const maxTenders = Math.min(tenderIds.length, 50);
    for (let i = 0; i < maxTenders; i++) {
      const tenderId = tenderIds[i];
      try {
        const detailUrl = `https://public.api.openprocurement.org/api/2.5/tenders/${tenderId}`;
        const detailResponse = await politeFetch(detailUrl, { method: "GET" }, env, ctx);

        if (!detailResponse.ok) {
          console.warn(`Failed to fetch tender ${tenderId}: ${detailResponse.status}`);
          continue;
        }

        const detailData = await detailResponse.json();
        if (!detailData || typeof detailData !== "object" || !("data" in detailData)) {
          continue;
        }

        const raw = detailData.data as Record<string, unknown>;
        const normalized = mapProzorro(raw);
        if (!normalized) continue;

        const result = await buildOpportunityRecord(normalized, filters);
        if (!result) continue;

        records.push(result.record);

        if (result.eligibleForDeepDive && normalized.url) {
          pdfJobs.push({
            opportunityId: result.record.opportunityId,
            source: "prozorro_ua",
            title: result.record.title,
            detailUrl: normalized.url,
            documentUrls: []
          });
        }
      } catch (error) {
        console.warn(`Error processing tender ${tenderId}:`, error);
        continue;
      }
    }

    return { records, pdfJobs };
  } catch (error) {
    console.error("Prozorro sync error", error);
    return { records, pdfJobs };
  }
}
