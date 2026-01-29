import type { Env, ExclusionRule, OpportunityRecord, PdfJob, SourceSystem } from "../types";
import { buildAgencyFilters } from "../filters";
import { buildOpportunityRecord, type NormalizedInput } from "../normalize/opportunity";
import { politeFetch } from "./http";
import { extractItems } from "../utils/mapping";

export interface ConnectorConfig {
  source: SourceSystem;
  getRequest: (env: Env) => Promise<{ url: string; init: RequestInit }>;
  map: (raw: Record<string, unknown>) => NormalizedInput | null;
  extractDocuments?: (raw: Record<string, unknown>) => string[];
  extractItemsFn?: (data: unknown) => unknown[];
}

export async function syncGenericSource(
  env: Env,
  ctx: ExecutionContext,
  rules: ExclusionRule[],
  config: ConnectorConfig
): Promise<{ records: OpportunityRecord[]; pdfJobs: PdfJob[] }> {
  const filters = buildAgencyFilters(env.EXCLUDED_BUREAUS, env.PRIORITY_AGENCIES, rules);

  try {
    const { url, init } = await config.getRequest(env);
    const response = await politeFetch(url, init, env, ctx);

    if (!response.ok) {
      throw new Error(`${config.source} sync failed: HTTP ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const extractor = config.extractItemsFn ?? extractItems;
    const items = extractor(data);

    const records: OpportunityRecord[] = [];
    const pdfJobs: PdfJob[] = [];

    for (const item of items) {
      // Ensure item is an object
      if (!item || typeof item !== "object") continue;
      const raw = item as Record<string, unknown>;
      
      const normalized = config.map(raw);
      if (!normalized) continue;

      const result = await buildOpportunityRecord(normalized, filters);
      if (!result) continue;

      records.push(result.record);

      if (result.eligibleForDeepDive && config.extractDocuments) {
        const docs = config.extractDocuments(raw);
        // Always create a job if eligible, even if no explicit docs found immediately (browser step might find them later via detailUrl)
        // But for now, follow existing logic: only if docs found OR we have detailUrl.
        // Actually, existing logic in grantsGov.ts was:
        // if (eligible) pdfJobs.push(...) with documentUrls: extract...
        // So we keep that.
        pdfJobs.push({
          opportunityId: result.record.opportunityId,
          source: config.source,
          title: result.record.title,
          detailUrl: result.record.url,
          documentUrls: docs
        });
      }
    }

    return { records, pdfJobs };
  } catch (error) {
    console.error(`${config.source} sync error`, error);
    return { records: [], pdfJobs: [] };
  }
}
