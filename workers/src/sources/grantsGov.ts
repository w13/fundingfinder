import type { NormalizedInput } from "../normalize/opportunity";
import type { SourceDefinition } from "./types";

export const grantsGovDefinition: SourceDefinition = {
  id: "grants_gov",
  name: "Grants.gov",
  integrationType: "core_api"
};

export function mapGrantsGov(raw: Record<string, unknown>): NormalizedInput | null {
  const opportunityId = toString(raw.opportunityId ?? raw.opportunityNumber ?? raw.oppNumber ?? raw.fundingOpportunityNumber);
  if (!opportunityId) return null;
  const title = toString(raw.title ?? raw.opportunityTitle) ?? "Untitled Opportunity";
  return {
    source: "grants_gov",
    opportunityId,
    title,
    agency: toNullableString(raw.agency ?? raw.agencyName ?? raw.fundingAgency ?? raw.agencyCode),
    bureau: toNullableString(raw.bureau ?? raw.bureauName),
    status: toNullableString(raw.status ?? raw.opportunityStatus),
    summary: toNullableString(raw.synopsis ?? raw.description ?? raw.summary),
    eligibility: toNullableString(raw.eligibility ?? raw.eligibilityInfo),
    postedDate: toNullableString(raw.postedDate ?? raw.openDate),
    dueDate: toNullableString(raw.closeDate ?? raw.deadlineDate),
    url: toNullableString(raw.detailsUrl ?? raw.opportunityLink ?? raw.url),
    rawPayload: raw
  };
}

export function extractGrantsGovDocuments(raw: Record<string, unknown>): string[] {
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

function toString(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return null;
}

function toNullableString(value: unknown): string | null {
  return toString(value);
}
