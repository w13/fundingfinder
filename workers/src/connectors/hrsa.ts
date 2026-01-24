import type { Env, ExclusionRule, OpportunityRecord, PdfJob } from "../types";
import { syncGenericSource } from "./base";
import { extractHrsaDocuments, mapHrsa } from "../sources/hrsa";

export async function syncHrsa(
  env: Env,
  ctx: ExecutionContext,
  rules: ExclusionRule[] = []
): Promise<{ records: OpportunityRecord[]; pdfJobs: PdfJob[] }> {
  return syncGenericSource(env, ctx, rules, {
    source: "hrsa",
    getRequest: async (env) => {
      const url = new URL(env.HRSA_API_URL ?? "https://api.hrsa.gov/v1/grants");
      url.searchParams.set("postedWithinDays", "7");

      return {
        url: url.toString(),
        init: {
          method: "GET",
          headers: {
            "X-API-KEY": env.HRSA_API_KEY ?? ""
          }
        }
      };
    },
    map: mapHrsa,
    extractDocuments: extractHrsaDocuments
  });
}
