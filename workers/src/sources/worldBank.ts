import type { SourceDefinition } from "./types";

export const worldBankDefinition: SourceDefinition = {
  id: "worldbank",
  name: "World Bank",
  integrationType: "manual_url",
  parsing: {
    jsonKeys: {
      id: ["id", "noticeId", "procurementId", "reference", "refNo"],
      title: ["title", "projectTitle", "noticeTitle", "subject"],
      summary: ["description", "summary", "details"],
      agency: ["borrower", "buyer", "organization", "agency"],
      status: ["status", "noticeStatus", "stage", "procurementMethod"],
      url: ["url", "detailUrl", "noticeUrl", "link"],
      postedDate: ["publishDate", "postedDate", "datePublished"],
      dueDate: ["deadline", "dueDate", "dateClosing"]
    },
    jsonPaths: {
      agency: ["borrower.name", "buyer.name", "organization.name"]
    },
    xmlTags: {
      id: ["NOTICE_ID", "REFERENCE", "ID"],
      title: ["TITLE", "PROJECT_TITLE", "SUBJECT"],
      summary: ["DESCRIPTION", "SUMMARY"],
      agency: ["BORROWER", "ORGANISATION_NAME"],
      status: ["STATUS", "PROCUREMENT_METHOD"],
      url: ["URL", "NOTICE_URL"],
      postedDate: ["DATE_PUB", "PUBLISHED_DATE"],
      dueDate: ["DEADLINE", "DATE_CLOSING"]
    }
  }
};
