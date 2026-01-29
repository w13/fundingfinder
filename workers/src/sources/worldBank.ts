import type { NormalizedInput } from "../normalize/opportunity";
import type { SourceDefinition } from "./types";
import { toNullableString, toString } from "../utils/mapping";

export const worldBankDefinition: SourceDefinition = {
  id: "worldbank",
  name: "World Bank",
  integrationType: "core_api"
};

export function mapWorldBank(raw: Record<string, unknown>): NormalizedInput | null {
  const opportunityId = toString(raw.id);
  if (!opportunityId) return null;

  const title = toString(raw.bid_description ?? raw.project_name) ?? "Untitled World Bank Notice";
  
  return {
    source: "worldbank",
    opportunityId,
    title,
    agency: "World Bank", // Fixed agency name
    bureau: toNullableString(raw.country_name), // Use country as bureau for grouping
    status: toNullableString(raw.notice_status ?? raw.notice_type),
    summary: toNullableString(raw.bid_description),
    eligibility: toNullableString(raw.procurement_method), // Often describes the type of competition
    postedDate: toNullableString(raw.publication_date),
    dueDate: toNullableString(raw.deadline_date ?? raw.submission_date),
    url: toNullableString(raw.url),
    rawPayload: raw
  };
}
