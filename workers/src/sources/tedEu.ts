import type { NormalizedInput } from "../normalize/opportunity";
import type { SourceDefinition } from "./types";

export const tedEuDefinition: SourceDefinition = {
  id: "ted_eu",
  name: "TED Europe",
  integrationType: "ted_xml_zip"
};

export function mapTedNotice(
  data: {
    opportunityId: string;
    title: string;
    summary?: string | null;
    agency?: string | null;
    bureau?: string | null;
    status?: string | null;
    postedDate?: string | null;
    dueDate?: string | null;
    url?: string | null;
    rawPayload: unknown;
  }
): NormalizedInput | null {
  if (!data.opportunityId || !data.title) return null;
  return {
    source: "ted_eu",
    opportunityId: data.opportunityId,
    title: data.title,
    agency: data.agency ?? null,
    bureau: data.bureau ?? null,
    status: data.status ?? null,
    summary: data.summary ?? null,
    eligibility: "Economic operators, suppliers, and contractors.",
    postedDate: data.postedDate ?? null,
    dueDate: data.dueDate ?? null,
    url: data.url ?? null,
    rawPayload: data.rawPayload
  };
}
