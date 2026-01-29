import type { SourceDefinition } from "./types";

export const jetroDefinition: SourceDefinition = {
  id: "jetro_jp",
  name: "JETRO",
  integrationType: "manual_url",
  scraping: {
    itemSelector: ".procurement-list li, ul.list-arrow li, table.procurement tr",
    fields: {
      title: { selector: "a" },
      url: { selector: "a", attr: "href" },
      postedDate: { selector: "span.date, td.date", regex: "(\d{4}.\d{1,2}.\d{1,2})" },
      summary: { selector: "p.description" }
    }
  }
};
