import type { Env, ExclusionRule, OpportunityRecord, PdfJob } from "../types";
import { syncGenericSource } from "./base";
import { mapChileCompra } from "../sources/chileCompra";

export async function syncChileCompra(
  env: Env,
  ctx: ExecutionContext,
  rules: ExclusionRule[] = []
): Promise<{ records: OpportunityRecord[]; pdfJobs: PdfJob[] }> {
  return syncGenericSource(env, ctx, rules, {
    source: "chilecompra_cl",
    getRequest: async (env) => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const dateStr = `${day}${month}${year}`; // ddMMyyyy

      const url = `https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?fecha=${dateStr}&ticket=${env.CHILE_COMPRA_API_KEY ?? ""}`;
      
      return {
        url,
        init: { method: "GET" }
      };
    },
    map: mapChileCompra,
    extractItemsFn: (data: unknown) => {
      const rec = data as any;
      if (rec.Listado && Array.isArray(rec.Listado)) return rec.Listado;
      return [];
    }
  });
}
