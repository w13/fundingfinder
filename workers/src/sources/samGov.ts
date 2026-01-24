import type { NormalizedInput } from "../normalize/opportunity";
import type { SourceDefinition } from "./types";
import { toNullableString, toString } from "../connectors/mappingUtils";

export const samGovDefinition: SourceDefinition = {
  id: "sam_gov",
  name: "SAM.gov",
  integrationType: "core_api"
};

export function mapSamGov(raw: Record<string, unknown>): NormalizedInput | null {
  const opportunityId = toString(raw.noticeId ?? raw.solicitationNumber ?? raw.opportunityId);
  if (!opportunityId) return null;
  const title = toString(raw.title ?? raw.noticeTitle) ?? "Untitled Opportunity";
  return {
    source: "sam_gov",
    opportunityId,
    title,
    agency: toNullableString(raw.departmentName ?? raw.subTier ?? raw.agencyName ?? raw.agency),
    bureau: toNullableString(raw.office ?? raw.officeName),
    status: toNullableString(raw.active ?? raw.status ?? raw.responseDeadLine),
    summary: toNullableString(raw.description ?? raw.summary ?? raw.synopsis),
    eligibility: toNullableString(raw.eligibility ?? raw.eligibilityRequirements),
    postedDate: toNullableString(raw.postedDate ?? raw.publishDate),
    dueDate: toNullableString(raw.responseDeadLine ?? raw.archiveDate),
    url: toNullableString(raw.uiLink ?? raw.url ?? raw.noticeUrl),
    rawPayload: raw
  };
}

export function extractSamGovDocuments(raw: Record<string, unknown>): string[] {
  const urls: string[] = [];
  const docs = raw.resourceLinks ?? raw.documents ?? raw.attachments;
  if (Array.isArray(docs)) {
    for (const doc of docs) {
      if (typeof doc === "string" && doc.includes(".pdf")) {
        urls.push(doc);
        continue;
      }
      const url = toNullableString((doc as Record<string, unknown>).url ?? (doc as Record<string, unknown>).href);
      if (url) urls.push(url);
    }
  }
  return urls;
}
