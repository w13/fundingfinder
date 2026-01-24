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
  integrationType: "core_api" | "ted_xml_zip" | "bulk_xml_zip" | "bulk_xml" | "bulk_json" | "manual_url";
  autoUrl: string | null;
  expectedResults: number | null;
  active: boolean;
  lastSync: string | null;
  lastStatus: string | null;
  lastError: string | null;
  lastIngested: number;
  createdAt: string;
  updatedAt: string;
};

export type SourceOption = {
  id: string;
  name: string;
  country: string | null;
  homepage: string | null;
};
