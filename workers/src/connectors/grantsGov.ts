import type { Env, ExclusionRule, OpportunityRecord, PdfJob } from "../types";
import { syncGenericSource } from "./base";
import { extractGrantsGovDocuments, mapGrantsGov } from "../sources/grantsGov";

export async function syncGrantsGov(
  env: Env,
  ctx: ExecutionContext,
  rules: ExclusionRule[] = []
): Promise<{ records: OpportunityRecord[]; pdfJobs: PdfJob[] }> {
  return syncGenericSource(env, ctx, rules, {
    source: "grants_gov",
    getRequest: async (env) => {
      const now = new Date();
      const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      
      const payload = {
        startDate: startDate.toISOString().slice(0, 10),
        endDate: now.toISOString().slice(0, 10),
        rows: 100,
        sortBy: "openDate|desc"
      };

      return {
        url: env.GRANTS_GOV_API_URL ?? "https://api.grants.gov/v1/api/search2",
        init: {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": env.GRANTS_GOV_API_KEY ?? ""
          },
          body: JSON.stringify(payload)
        }
      };
    },
    map: mapGrantsGov,
    extractDocuments: extractGrantsGovDocuments
  });
}
