import type { NormalizedInput } from "../normalize/opportunity";
import type { SourceDefinition } from "./types";
import { toNullableString, toString } from "../utils/mapping";

export const prozorroDefinition: SourceDefinition = {
  id: "prozorro_ua",
  name: "Prozorro",
  integrationType: "core_api"
};

export function mapProzorro(raw: Record<string, unknown>): NormalizedInput | null {
  const opportunityId = toString(raw.tenderID ?? raw.id);
  if (!opportunityId) return null;
  
  // Title - can be a string or multilingual object
  let title = toString(raw.title);
  if (!title && raw.title && typeof raw.title === "object") {
    // Try to get from multilingual object (usually has 'uk', 'en', etc.)
    const titleObj = raw.title as Record<string, unknown>;
    title = toString(titleObj.uk ?? titleObj.en ?? titleObj.ru ?? Object.values(titleObj)[0]);
  }
  if (!title) {
    title = "Untitled Tender";
  }

  // Procuring entity - can have name directly or in identifier.legalName
  const procuringEntity = raw.procuringEntity as Record<string, unknown> | undefined;
  let agency: string | null = null;
  if (procuringEntity) {
    agency = toNullableString(procuringEntity.name) ?? 
             toNullableString((procuringEntity.identifier as Record<string, unknown>)?.legalName) ??
             toNullableString((procuringEntity.identifier as Record<string, unknown>)?.name);
  }

  // Description - check items array for descriptions, or use description field
  let summary: string | null = toNullableString(raw.description);
  if (!summary && Array.isArray(raw.items) && raw.items.length > 0) {
    const firstItem = raw.items[0] as Record<string, unknown>;
    summary = toNullableString(firstItem.description);
    // If multiple items, combine descriptions
    if (raw.items.length > 1 && summary) {
      const otherDescriptions = raw.items.slice(1)
        .map((item: unknown) => {
          const itemObj = item as Record<string, unknown>;
          return toNullableString(itemObj.description);
        })
        .filter((desc): desc is string => desc !== null)
        .join("; ");
      if (otherDescriptions) {
        summary = `${summary}; ${otherDescriptions}`;
      }
    }
  }

  // Tender period - check for endDate in tenderPeriod or items deliveryDate
  let dueDate: string | null = null;
  const tenderPeriod = raw.tenderPeriod as Record<string, unknown> | undefined;
  if (tenderPeriod) {
    dueDate = toNullableString(tenderPeriod.endDate);
  }
  // Fallback to items deliveryDate
  if (!dueDate && Array.isArray(raw.items) && raw.items.length > 0) {
    const firstItem = raw.items[0] as Record<string, unknown>;
    const deliveryDate = firstItem.deliveryDate as Record<string, unknown> | undefined;
    if (deliveryDate) {
      dueDate = toNullableString(deliveryDate.endDate);
    }
  }

  return {
    source: "prozorro_ua",
    opportunityId,
    title,
    agency,
    bureau: null,
    status: toNullableString(raw.status),
    summary,
    eligibility: toNullableString(raw.procurementMethod) ?? toNullableString(raw.procurementMethodType),
    postedDate: toNullableString(raw.dateModified ?? raw.date ?? raw.dateCreated),
    dueDate,
    url: `https://prozorro.gov.ua/tender/${opportunityId}`,
    rawPayload: raw
  };
}
