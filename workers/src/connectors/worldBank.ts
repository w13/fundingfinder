import type { Env, ExclusionRule, OpportunityRecord, PdfJob } from "../types";
import { syncGenericSource } from "./base";
import { mapWorldBank } from "../sources/worldBank";

export async function syncWorldBank(
  env: Env,
  ctx: ExecutionContext,
  rules: ExclusionRule[] = []
): Promise<{ records: OpportunityRecord[]; pdfJobs: PdfJob[] }> {
  return syncGenericSource(env, ctx, rules, {
    source: "worldbank",
    getRequest: async () => {
      const now = new Date();
      const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      
      // Socrata OData filter
      const filter = `publication_date ge ${startDate.toISOString()}`;
      const url = `https://finances.worldbank.org/api/odata/v4/3y7n-xmbj?$filter=${encodeURIComponent(filter)}&$orderby=publication_date desc`;

      return {
        url,
        init: { method: "GET" }
      };
    },
    map: mapWorldBank,
    extractItemsFn: (data: unknown) => {
      if (data && typeof data === "object" && "value" in data && Array.isArray((data as Record<string, unknown>).value)) {
        return (data as Record<string, unknown>).value as unknown[];
      }
      return [];
    }
  });
}
