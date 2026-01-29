import type { SourceDefinition } from "./types";

export const ungmDefinition: SourceDefinition = {
  id: "ungm",
  name: "UN Global Marketplace",
  integrationType: "manual_url",
  scraping: {
    itemSelector: "div.result-item, table#tblNotices tr",
    fields: {
      title: { selector: "a.notice-title, .title a" },
      url: { selector: "a.notice-title, .title a", attr: "href" },
      summary: { selector: ".description, .summary" },
      agency: { selector: ".agency-name, .organisation" },
      postedDate: { selector: ".published-date, td:nth-child(1)" },
      dueDate: { selector: ".deadline, td:nth-child(4)" }
    },
    nextPageSelector: "a.next-page, ul.pagination li.next a"
  }
};
