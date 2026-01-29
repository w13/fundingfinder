export type Opportunity = {
  id: string;
  opportunityId: string;
  source: string;
  title: string;
  agency: string | null;
  status: string | null;
  summary: string | null;
  postedDate: string | null;
  dueDate: string | null;
  keywordScore: number;
  feasibilityScore: number | null;
  suitabilityScore?: number | null;
  profitabilityScore: number | null;
};

export type OpportunityDetail = Opportunity & {
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
    sectionMap: {
      programDescription: string | null;
      requirements: string | null;
      evaluationCriteria: string | null;
    } | null;
  }>;
};

export type OpportunitySearchResponse = {
  items: Opportunity[];
  warning?: string;
};

export type SourceSummary = {
  source: string;
  total: number;
  forProfitEligible: number;
  lastUpdated: string | null;
};

export type AdminSummary = {
  totalOpportunities: number;
  forProfitEligible: number;
  analyzed: number;
  highFeasibility: number;
  lastUpdated: string | null;
  sources: SourceSummary[];
};

export type SourceHealthSummary = {
  sourceId: string;
  lastSuccessfulSync: string | null;
  errorRate: number;
  ingestedLast24h: number;
  recentFailures: number;
  lastError: string | null;
};

export type PdfJobMetrics = {
  queued: number;
  processing: number;
  completedLast24h: number;
  failedLast24h: number;
  avgProcessingMs: number | null;
  lastCompletedAt: string | null;
  lastFailureReason: string | null;
};

export type ExclusionRule = {
  id: string;
  ruleType: "excluded_bureau" | "priority_agency";
  value: string;
  active: boolean;
  createdAt: string;
};

export type FundingSource = {
  id: string;
  name: string;
  country: string | null;
  homepage: string | null;
  integrationType: "core_api" | "ted_xml_zip" | "bulk_xml_zip" | "bulk_xml" | "bulk_json" | "bulk_csv" | "manual_url";
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
};

export type SavedSearch = {
  id: string;
  name: string;
  query: string | null;
  source: string | null;
  minScore: number | null;
  mode: "smart" | "exact" | "any" | null;
  createdAt: string;
};

export type SearchBoost = {
  id: string;
  entityType: "source" | "agency";
  entityValue: string;
  boost: number;
  updatedAt: string;
};

export type SearchAnalyticsSummary = {
  topQueries: Array<{ query: string | null; clicks: number }>;
  topSources: Array<{ source: string; clicks: number }>;
  recentClicks: Array<{
    query: string | null;
    source: string;
    opportunityId: string;
    createdAt: string;
    position: number | null;
  }>;
};

export type NotificationChannel = {
  id: string;
  name: string;
  type: "webhook" | "slack" | "email";
  config: Record<string, unknown>;
  severityThreshold: "low" | "medium" | "high" | "critical";
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NormalizationDiagnosticsSummary = {
  source: string;
  missingCounts: Record<string, number>;
  guessedCounts: Record<string, number>;
  lastSeenAt: string | null;
};

export type SourceOption = {
  id: string;
  name: string;
  country: string | null;
  homepage: string | null;
};

export type ShortlistItem = {
  shortlistId: string;
  opportunityRecordId: string;
  opportunityId: string;
  source: string;
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
};

