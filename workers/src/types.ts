export type SourceSystem = string;

export const INTEGRATION_TYPES = [
  "core_api",
  "ted_xml_zip",
  "bulk_xml_zip",
  "bulk_xml",
  "bulk_json",
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
  GRANTS_GOV_API_KEY?: string;
  SAM_GOV_API_KEY?: string;
  HRSA_API_KEY?: string;
  TED_BULK_DOWNLOAD_URL?: string;
  TED_MAX_NOTICES?: string;
  BULK_MAX_NOTICES?: string;
  COMPANY_PROFILE?: string;
  EXCLUDED_BUREAUS?: string;
  PRIORITY_AGENCIES?: string;
  POLITE_DELAY_MS?: string;
  NOTIFICATION_WEBHOOK_URL?: string;
}
