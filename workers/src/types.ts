export type SourceSystem = string;

export const INTEGRATION_TYPES = [
  "core_api",
  "ted_xml_zip",
  "bulk_xml_zip",
  "bulk_xml",
  "bulk_json",
  "bulk_csv",
  "manual_url"
] as const;

export type SourceIntegrationType = (typeof INTEGRATION_TYPES)[number];

export function isIntegrationType(value: string | null | undefined): value is SourceIntegrationType {
  return INTEGRATION_TYPES.includes(value as SourceIntegrationType);
}

export interface OpportunityRecord {
  id: string;
  opportunityId: string;
  source: SourceSystem;
  title: string;
  agency: string | null;
  bureau: string | null;
  status: string | null;
  summary: string | null;
  eligibility: string | null;
  forProfitEligible: boolean;
  smallBusinessEligible: boolean;
  keywordScore: number;
  postedDate: string | null;
  dueDate: string | null;
  url: string | null;
  version: number;
  versionHash: string;
  rawPayload: unknown;
}

export interface PdfJob {
  opportunityId: string;
  source: SourceSystem;
  title: string;
  detailUrl: string | null;
  documentUrls: string[];
}

export interface AnalysisResult {
  feasibilityScore: number;
  suitabilityScore: number;
  profitabilityScore: number;
  summaryBullets: string[];
  constraints: string[];
  model: string;
}

export interface SectionSlices {
  programDescription: string | null;
  requirements: string | null;
  evaluationCriteria: string | null;
}

export type ExclusionRuleType = "excluded_bureau" | "priority_agency";

export interface ExclusionRule {
  id: string;
  ruleType: ExclusionRuleType;
  value: string;
  active: boolean;
  createdAt: string;
}

export interface AdminSummary {
  totalOpportunities: number;
  forProfitEligible: number;
  analyzed: number;
  highFeasibility: number;
  lastUpdated: string | null;
  sources: Array<{
    source: SourceSystem;
    total: number;
    forProfitEligible: number;
    lastUpdated: string | null;
  }>;
}

export interface FundingSource {
  id: SourceSystem;
  name: string;
  country: string | null;
  homepage: string | null;
  integrationType: SourceIntegrationType;
  autoUrl: string | null;
  expectedResults: number | null;
  active: boolean;
  lastSync: string | null;
  lastStatus: string | null;
  lastError: string | null;
  lastIngested: number;
  createdAt: string;
  updatedAt: string;
}

export interface Env {
  DB: D1Database;
  PDF_BUCKET: R2Bucket;
  PDF_QUEUE: Queue<PdfJob>;
  AI: Ai;
  VECTORIZE: VectorizeIndex;
  BROWSER?: Fetcher;
  
  // Secrets
  ADMIN_API_KEY?: string;
  GRANTS_GOV_API_KEY?: string;
  SAM_GOV_API_KEY?: string;
  HRSA_API_KEY?: string;
  AUSTENDER_API_KEY?: string;
  CHILE_COMPRA_API_KEY?: string;
  
  // Configuration
  GRANTS_GOV_API_URL?: string;
  SAM_GOV_API_URL?: string;
  HRSA_API_URL?: string;
  
  TED_BULK_DOWNLOAD_URL?: string;
  TED_MAX_NOTICES?: string;
  BULK_MAX_NOTICES?: string;
  COMPANY_PROFILE?: string;
  EXCLUDED_BUREAUS?: string;
  PRIORITY_AGENCIES?: string;
  POLITE_DELAY_MS?: string;
  NOTIFICATION_WEBHOOK_URL?: string;
}

export interface SyncSourcePayload {
  sourceId: string;
  options: { url?: string; maxNotices?: number };
}

export type TaskPayload = SyncSourcePayload;

export interface OpportunityQuery {
  query?: string;
  source?: SourceSystem;
  minScore?: number;
  limit?: number;
  mode?: "smart" | "exact" | "any";
}

export interface OpportunityListItem {
  id: string;
  opportunityId: string;
  source: SourceSystem;
  title: string;
  agency: string | null;
  status: string | null;
  summary: string | null;
  postedDate: string | null;
  dueDate: string | null;
  keywordScore: number;
  feasibilityScore: number | null;
  suitabilityScore: number | null;
  profitabilityScore: number | null;
}

export interface OpportunityDetail extends OpportunityListItem {
  eligibility: string | null;
  url: string | null;
  forProfitEligible: boolean;
  smallBusinessEligible: boolean;
  analysisSummary: string[];
  constraints: string[];
  documents: Array<{
    id: string;
    documentUrl: string;
    r2Key: string;
    sectionMap: SectionSlices | null;
  }>;
}

export interface ShortlistItem {
  shortlistId: string;
  opportunityRecordId: string;
  opportunityId: string;
  source: SourceSystem;
  title: string;
  agency: string | null;
  summary: string | null;
  postedDate: string | null;
  dueDate: string | null;
  feasibilityScore: number | null;
  suitabilityScore: number | null;
  profitabilityScore: number | null;
  analysisSummary: string[];
  constraints: string[];
  analyzed: boolean;
}

export interface ShortlistAnalysisCandidate {
  shortlistId: string;
  opportunityId: string;
  source: SourceSystem;
  title: string;
  summary: string | null;
  eligibility: string | null;
  textExcerpt: string | null;
  sectionMap: SectionSlices | null;
}
