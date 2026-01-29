import type { NormalizedInput } from "../normalize/opportunity";
import type { SourceDefinition } from "./types";
import { toNullableString, toString } from "../utils/mapping";

export const chileCompraDefinition: SourceDefinition = {
  id: "chilecompra_cl",
  name: "ChileCompra",
  integrationType: "core_api"
};

export function mapChileCompra(raw: Record<string, unknown>): NormalizedInput | null {
  const opportunityId = toString(raw.CodigoExterno);
  if (!opportunityId) return null;

  return {
    source: "chilecompra_cl",
    opportunityId,
    title: toString(raw.Nombre) ?? "Untitled Tender",
    agency: toNullableString((raw.Comprador as any)?.NombreOrganismo),
    bureau: null,
    status: toNullableString(raw.Estado),
    summary: toNullableString(raw.Descripcion),
    eligibility: null,
    postedDate: toNullableString(raw.FechaCreacion),
    dueDate: toNullableString(raw.FechaCierre),
    url: `http://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?qs=${raw.CodigoExterno}`,
    rawPayload: raw
  };
}
