import type { Env, ExclusionRule, OpportunityRecord, PdfJob } from "../types";
import { syncGenericSource } from "./base";
import { mapContractsFinder } from "../sources/contractsFinder";

export async function syncContractsFinder(
  env: Env,
  ctx: ExecutionContext,
  rules: ExclusionRule[] = []
): Promise<{ records: OpportunityRecord[]; pdfJobs: PdfJob[] }> {
  return syncGenericSource(env, ctx, rules, {
    source: "contracts_finder_uk",
    getRequest: async () => {
      // OCDS Search API
      // Sort by publication date descending
      const url = "https://www.contractsfinder.service.gov.uk/Published/Notices/OCDS/Search?limit=100&sort=publishedDate&order=desc";
      return {
        url,
        init: { method: "GET" }
      };
    },
    map: mapContractsFinder,
    extractItemsFn: (data: unknown) => {
      // OCDS returns { items: [...] } or { releases: [...] }?
      // UK API documentation says it returns a list of results.
      // Usually { results: [...] } or just [...]
      // Let's assume standard 'results' or 'items' handled by default, or check for 'items'.
      // Based on docs, it returns a paginated structure.
      // We'll rely on mappingUtils 'items'/'results', but explicit is better.
      const rec = data as any;
      if (rec.results && Array.isArray(rec.results)) return rec.results;
      if (rec.items && Array.isArray(rec.items)) return rec.items;
      if (Array.isArray(rec)) return rec; // Direct array?
      return [];
    }
  });
}
