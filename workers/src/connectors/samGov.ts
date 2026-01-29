import type { Env, ExclusionRule, OpportunityRecord, PdfJob } from "../types";
import { syncGenericSource } from "./base";
import { extractSamGovDocuments, mapSamGov } from "../sources/samGov";
import { extractItems } from "../utils/mapping";

export async function syncSamGov(
  env: Env,
  ctx: ExecutionContext,
  rules: ExclusionRule[] = []
): Promise<{ records: OpportunityRecord[]; pdfJobs: PdfJob[] }> {
  return syncGenericSource(env, ctx, rules, {
    source: "sam_gov",
    getRequest: async (env) => {
      const now = new Date();
      const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      
      const url = new URL(env.SAM_GOV_API_URL ?? "https://api.sam.gov/opportunities/v2/search");
      url.searchParams.set("api_key", env.SAM_GOV_API_KEY ?? "");
      url.searchParams.set("postedFrom", startDate.toISOString().slice(0, 10));
      url.searchParams.set("postedTo", now.toISOString().slice(0, 10));
      url.searchParams.set("limit", "100");
      url.searchParams.set("offset", "0");

      return {
        url: url.toString(),
        init: { method: "GET" }
      };
    },
    map: mapSamGov,
    extractDocuments: extractSamGovDocuments,
    extractItemsFn: (data: unknown) => {
       const rec = data as Record<string, any>;
       // SAM.gov specific structure check
       if (rec?.opportunitiesData) {
          if (Array.isArray(rec.opportunitiesData)) return rec.opportunitiesData;
          if (Array.isArray(rec.opportunitiesData.results)) return rec.opportunitiesData.results;
       }
       // Fallback to standard extractor
       return extractItems(data);
    }
  });
}
