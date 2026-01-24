import type { NormalizedInput } from "../normalize/opportunity";
import type { SourceDefinition } from "./types";
import { toNullableString, toString } from "../connectors/mappingUtils";

export const hrsaDefinition: SourceDefinition = {
  id: "hrsa",
  name: "HRSA",
  integrationType: "core_api"
};

export function mapHrsa(raw: Record<string, unknown>): NormalizedInput | null {
  const opportunityId = toString(raw.opportunityId ?? raw.opportunityNumber ?? raw.id);
  if (!opportunityId) return null;
  const title = toString(raw.title ?? raw.opportunityTitle) ?? "Untitled Opportunity";
  return {
    source: "hrsa",
    opportunityId,
    title,
    agency: toNullableString(raw.agency ?? "HRSA"),
    bureau: toNullableString(raw.bureau ?? raw.office),
    status: toNullableString(raw.status ?? raw.openStatus),
    summary: toNullableString(raw.summary ?? raw.description),
    eligibility: toNullableString(raw.eligibility ?? raw.eligibilityText),
    postedDate: toNullableString(raw.postedDate ?? raw.openDate),
    dueDate: toNullableString(raw.closeDate ?? raw.dueDate),
    url: toNullableString(raw.url ?? raw.detailsUrl),
    rawPayload: raw
  };
}

export function extractHrsaDocuments(raw: Record<string, unknown>): string[] {
  const urls: string[] = [];
  const docs = raw.documents ?? raw.attachments;
  if (Array.isArray(docs)) {
    for (const doc of docs) {
      const url = toNullableString((doc as Record<string, unknown>).url ?? (doc as Record<string, unknown>).href);
      if (url) urls.push(url);
    }
  }
  return urls;
}
