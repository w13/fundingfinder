import type { Env, ExclusionRule, OpportunityRecord, PdfJob } from "../types";
import { syncGenericSource } from "./base";
import { mapAusTender } from "../sources/ausTender";

export async function syncAusTender(
  env: Env,
  ctx: ExecutionContext,
  rules: ExclusionRule[] = []
): Promise<{ records: OpportunityRecord[]; pdfJobs: PdfJob[] }> {
  return syncGenericSource(env, ctx, rules, {
    source: "austender_au",
    getRequest: async (env) => {
      // OCDS API - Example endpoint, requires key
      // Assuming standard OCDS listing for releases
      const url = "https://api.tenders.gov.au/ocds/releases/all?limit=100&descending=true";
      return {
        url,
        init: {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${env.AUSTENDER_API_KEY ?? ""}`
          }
        }
      };
    },
    map: mapAusTender,
    extractItemsFn: (data: unknown) => {
      const rec = data as any;
      if (rec.releases && Array.isArray(rec.releases)) return rec.releases;
      if (rec.results && Array.isArray(rec.results)) return rec.results;
      return [];
    }
  });
}
