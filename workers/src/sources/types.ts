import type { SourceIntegrationType, SourceSystem } from "../types";

export type FieldMap = {
  id: string[];
  title: string[];
  summary: string[];
  agency: string[];
  status: string[];
  url: string[];
  postedDate: string[];
  dueDate: string[];
  bureau?: string[];
  eligibility?: string[];
};

export type BulkParsingProfile = {
  xmlTags: FieldMap;
  jsonKeys: FieldMap;
  jsonPaths?: { agency?: string[] };
  entryTags?: string[];
};

export interface SourceDefinition {
  id: SourceSystem;
  name: string;
  integrationType: SourceIntegrationType;
  parsing?: BulkParsingProfile;
}
