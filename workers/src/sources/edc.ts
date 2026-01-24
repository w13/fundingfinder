import type { SourceDefinition } from "./types";

export const edcDefinition: SourceDefinition = {
  id: "edc_ca",
  name: "Export Development Canada",
  integrationType: "manual_url",
  parsing: {
    jsonKeys: {
      id: ["id", "opportunityId", "reference", "refNo"],
      title: ["title", "noticeTitle", "subject", "name"],
      summary: ["summary", "description", "details"],
      agency: ["agency", "issuer", "buyer", "organization"],
      status: ["status", "stage"],
      url: ["url", "detailUrl", "link"],
      postedDate: ["postedDate", "publishDate", "datePublished"],
      dueDate: ["dueDate", "deadline", "dateClosing"]
    },
    jsonPaths: {
      agency: ["organization.name", "buyer.name", "issuer.name"]
    },
    xmlTags: {
      id: ["NOTICE_ID", "REFERENCE", "ID"],
      title: ["TITLE", "SUBJECT"],
      summary: ["DESCRIPTION", "SUMMARY"],
      agency: ["ORGANISATION_NAME", "CONTRACTING_BODY"],
      status: ["STATUS"],
      url: ["URL", "NOTICE_URL"],
      postedDate: ["DATE_PUB", "PUBLISHED_DATE"],
      dueDate: ["DEADLINE", "DATE_CLOSING"]
    }
  }
};
