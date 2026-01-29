import type { NormalizedInput } from "../normalize/opportunity";
import type { SourceDefinition } from "./types";
import { toNullableString, toString } from "../utils/mapping";

export const contractsFinderDefinition: SourceDefinition = {
  id: "contracts_finder_uk",
  name: "Contracts Finder UK",
  integrationType: "core_api"
};

export function mapContractsFinder(raw: Record<string, unknown>): NormalizedInput | null {
  // OCDS Release object
  // Sometimes 'tender' is top level if mapped, but in OCDS it's inside.
  // We assume 'raw' is the release object.
  const tender = raw.tender as Record<string, unknown> | undefined;
  const buyer = raw.buyer as Record<string, unknown> | undefined;
  
  if (!tender) return null;

  const opportunityId = toString(tender.id ?? raw.id);
  if (!opportunityId) return null;

  return {
    source: "contracts_finder_uk",
    opportunityId,
    title: toString(tender.title) ?? "Untitled Contract",
    agency: toNullableString(buyer?.name),
    bureau: null,
    status: toNullableString(tender.status),
    summary: toNullableString(tender.description),
    eligibility: toNullableString(tender.procurementMethod),
    postedDate: toNullableString(raw.date), // Release date
    dueDate: toNullableString((tender.tenderPeriod as any)?.endDate),
    url: toNullableString((tender.documents as any[])?.[0]?.url), // Often no direct link field, but doc link
    rawPayload: raw
  };
}
