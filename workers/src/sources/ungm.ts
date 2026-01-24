import type { SourceDefinition } from "./types";

export const ungmDefinition: SourceDefinition = {
  id: "ungm",
  name: "UN Global Marketplace",
  integrationType: "manual_url",
  parsing: {
    jsonKeys: {
      id: ["noticeId", "id", "tenderId", "reference", "refNo", "referenceNumber"],
      title: ["title", "noticeTitle", "subject", "name"],
      summary: ["description", "summary", "details", "shortDescription"],
      agency: ["organization", "agency", "buyer", "issuer", "procuringEntity"],
      status: ["status", "noticeStatus", "stage"],
      url: ["noticeUrl", "url", "link", "detailUrl"],
      postedDate: ["publishedDate", "datePublished", "postedDate", "publishDate"],
      dueDate: ["deadlineDate", "closingDate", "dueDate", "dateClosing"]
    },
    jsonPaths: {
      agency: ["organization.name", "buyer.name", "procuringEntity.name"]
    },
    xmlTags: {
      id: ["NOTICE_ID", "NOTICE_NUMBER", "REFERENCE"],
      title: ["TITLE", "SUBJECT"],
      summary: ["DESCRIPTION", "SUMMARY"],
      agency: ["ORGANISATION_NAME", "CONTRACTING_BODY"],
      status: ["STATUS", "NOTICE_STATUS"],
      url: ["URL", "NOTICE_URL"],
      postedDate: ["DATE_PUB", "PUBLISHED_DATE"],
      dueDate: ["DEADLINE", "DATE_CLOSING"]
    }
  }
};
