import type { SourceDefinition } from "./types";

export const undpDefinition: SourceDefinition = {
  id: "undp",
  name: "UNDP Procurement Notices",
  integrationType: "manual_url",
  scraping: {
    // Selectors are hypothetical based on standard tables; adjust as needed
    itemSelector: "table#table_id tr, table.table tr", 
    fields: {
      title: { selector: "a" },
      url: { selector: "a", attr: "href" },
      summary: { selector: "span.description, div.description" },
      agency: { selector: ".agency-name" }, // Default to UNDP if not found
      postedDate: { selector: "td:nth-child(1), .date" },
      dueDate: { selector: "td:last-child, .deadline" }
    }
  }
};
