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
  diagnostics?: NormalizationDiagnostics;
}

export interface PdfJob {
  jobId: string;
  opportunityId: string;
  source: SourceSystem;
  title: string;
  detailUrl: string | null;
  documentUrls: string[];
  correlationId?: string | null;
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
  maxNotices: number | null;
  keywordIncludes: string | null;
  keywordExcludes: string | null;
  language: string | null;
  metadata: Record<string, unknown> | null;
  active: boolean;
  lastSync: string | null;
  lastSuccessfulSync: string | null;
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

export type NotificationSeverity = "low" | "medium" | "high" | "critical";

export interface NotificationChannel {
  id: string;
  name: string;
  type: "webhook" | "slack" | "email";
  config: Record<string, unknown>;
  severityThreshold: NotificationSeverity;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string | null;
  source: string | null;
  minScore: number | null;
  mode: "smart" | "exact" | "any" | null;
  createdAt: string;
}

export interface SearchClickEvent {
  id: string;
  query: string | null;
  sourceFilter: string | null;
  minScore: number | null;
  mode: "smart" | "exact" | "any" | null;
  opportunityId: string;
  source: string;
  resultId: string | null;
  position: number | null;
  correlationId: string | null;
  createdAt: string;
}

export interface SourceSyncRun {
  id: string;
  sourceId: string;
  status: "success" | "failed" | "syncing";
  startedAt: string;
  completedAt: string | null;
  ingestedCount: number;
  error: string | null;
  correlationId: string | null;
}

export interface SourceHealthSummary {
  sourceId: string;
  lastSuccessfulSync: string | null;
  errorRate: number;
  ingestedLast24h: number;
  recentFailures: number;
  lastError: string | null;
}

export interface PdfJobMetrics {
  queued: number;
  processing: number;
  completedLast24h: number;
  failedLast24h: number;
  avgProcessingMs: number | null;
  lastCompletedAt: string | null;
  lastFailureReason: string | null;
}

export interface FailedJob {
  id: string;
  jobType: string;
  payload: Record<string, unknown>;
  error: string | null;
  attempts: number;
  failedAt: string;
  correlationId: string | null;
}

export interface NormalizationDiagnostics {
  missingFields: string[];
  guessedFields: string[];
}

export interface NormalizationDiagnosticsSummary {
  source: string;
  missingCounts: Record<string, number>;
  guessedCounts: Record<string, number>;
  lastSeenAt: string | null;
}

export interface SearchBoost {
  id: string;
  entityType: "source" | "agency";
  entityValue: string;
  boost: number;
  updatedAt: string;
}

export interface SearchAnalyticsSummary {
  topQueries: Array<{ query: string | null; clicks: number }>;
  topSources: Array<{ source: string; clicks: number }>;
  recentClicks: Array<{
    query: string | null;
    source: string;
    opportunityId: string;
    createdAt: string;
    position: number | null;
  }>;
}

export interface SyncSourcePayload {
  sourceId: string;
  options: { url?: string; maxNotices?: number };
  correlationId?: string | null;
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
