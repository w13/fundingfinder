import type { SourceDefinition } from "./types";

export const canadaBuysDefinition: SourceDefinition = {
  id: "canadabuys_ca",
  name: "CanadaBuys",
  integrationType: "bulk_csv",
  parsing: {
    // Required by type definition, but unused for CSV
    xmlTags: { id: [], title: [], summary: [], agency: [], status: [], url: [], postedDate: [], dueDate: [] },
    jsonKeys: { id: [], title: [], summary: [], agency: [], status: [], url: [], postedDate: [], dueDate: [] },
    csvKeys: {
      id: ["solicitation_number", "reference_number", "tender_notice_number", "id"],
      title: ["title_en", "project_title", "solicitation_name", "title"],
      summary: ["description_en", "description", "summary"],
      agency: ["organization_name_en", "organization_name", "department", "buyer"],
      status: ["tender_status", "status", "stage"],
      url: ["link", "url", "solicitation_url"],
      postedDate: ["date_published", "published_date", "solicitation_date", "date_posted"],
      dueDate: ["date_closing", "closing_date", "tender_closing_date", "deadline"]
    }
  }
};
