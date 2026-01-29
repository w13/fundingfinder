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
  csvKeys?: FieldMap;
  jsonPaths?: { agency?: string[] };
  entryTags?: string[];
};

export type Selector = {
  selector: string | string[]; // Array implies priority fallback
  attr?: string; // If undefined, get text
  regex?: string; // Optional regex extraction to clean the value
};

export type ScrapingProfile = {
  itemSelector: string;
  nextPageSelector?: string;
  fields: {
    id?: Selector;
    title: Selector;
    url: Selector;
    summary?: Selector;
    agency?: Selector;
    postedDate?: Selector;
    dueDate?: Selector;
    status?: Selector;
  };
};

export interface SourceDefinition {
  id: SourceSystem;
  name: string;
  integrationType: SourceIntegrationType;
  parsing?: BulkParsingProfile;
  scraping?: ScrapingProfile;
}
