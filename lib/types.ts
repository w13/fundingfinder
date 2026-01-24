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
