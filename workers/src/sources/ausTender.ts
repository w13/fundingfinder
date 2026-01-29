import type { NormalizedInput } from "../normalize/opportunity";
import type { SourceDefinition } from "./types";
import { toNullableString, toString } from "../utils/mapping";

export const ausTenderDefinition: SourceDefinition = {
  id: "austender_au",
  name: "AusTender",
  integrationType: "core_api"
};

export function mapAusTender(raw: Record<string, unknown>): NormalizedInput | null {
  // OCDS Release object
  const tender = raw.tender as Record<string, unknown> | undefined;
  const buyer = raw.buyer as Record<string, unknown> | undefined;
  
  if (!tender) return null;

  const opportunityId = toString(tender.id ?? raw.id);
  if (!opportunityId) return null;

  return {
    source: "austender_au",
    opportunityId,
    title: toString(tender.title) ?? "Untitled Tender",
    agency: toNullableString(buyer?.name),
    bureau: null,
    status: toNullableString(tender.status),
    summary: toNullableString(tender.description),
    eligibility: toNullableString(tender.procurementMethod),
    postedDate: toNullableString(raw.date),
    dueDate: toNullableString((tender.tenderPeriod as any)?.endDate),
    url: toNullableString((tender.documents as any[])?.[0]?.url) ?? `https://www.tenders.gov.au/Atm/Show/${opportunityId}`, // Fallback URL guess
    rawPayload: raw
  };
}
