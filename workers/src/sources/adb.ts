import type { SourceDefinition } from "./types";

export const adbDefinition: SourceDefinition = {
  id: "adb",
  name: "Asian Development Bank",
  integrationType: "manual_url",
  scraping: {
    itemSelector: ".view-id-tenders .views-row, table.views-table tr",
    fields: {
      title: { selector: ".views-field-title a" },
      url: { selector: ".views-field-title a", attr: "href" },
      summary: { selector: ".views-field-body, .views-field-field-summary" },
      agency: { selector: ".views-field-field-agency" }, // Often country or sector
      status: { selector: ".views-field-field-tender-status" },
      postedDate: { selector: ".views-field-created, .views-field-field-date-posted" },
      dueDate: { selector: ".views-field-field-deadline" }
    },
    nextPageSelector: "li.pager-next a"
  }
};
