import { normalizeText, parseCsvList } from "./utils";

const REQUIRED_TERMS = [
  "for-profit",
  "for profit",
  "small business",
  "small businesses",
  "industry",
  "commercial",
  "sbir",
  "sttr"
];

const EXCLUDED_ENTITIES = [
  "state government",
  "local government",
  "county government",
  "tribal government",
  "tribal organization",
  "higher education",
  "college",
  "university"
];

const KEYWORDS = [
  "clinical decision support",
  "infection surveillance",
  "digital therapeutics",
  "precision medicine",
  "remote patient monitoring",
  "patient engagement",
  "clinical ai",
  "health data interoperability",
  "fhir",
  "hl7",
  "predictive analytics",
  "medical imaging",
  "behavioral health",
  "care coordination",
  "risk stratification"
];

export interface EligibilityResult {
  forProfitEligible: boolean;
  smallBusinessEligible: boolean;
  excluded: boolean;
  keywordScore: number;
}

export interface AgencyFilters {
  excludedBureaus: string[];
  priorityAgencies: string[];
}

export function buildAgencyFilters(excludedBureaus?: string, priorityAgencies?: string): AgencyFilters {
  return {
    excludedBureaus: parseCsvList(excludedBureaus).map((item) => item.toLowerCase()),
    priorityAgencies: parseCsvList(priorityAgencies).map((item) => item.toLowerCase())
  };
}

export function evaluateEligibility(eligibilityText: string | null | undefined): EligibilityResult {
  const normalized = normalizeText(eligibilityText).toLowerCase();
  const forProfitEligible = REQUIRED_TERMS.some((term) => normalized.includes(term));
  const smallBusinessEligible = normalized.includes("small business") || normalized.includes("sbir");
  const excludedEntity = EXCLUDED_ENTITIES.some((term) => normalized.includes(term));
  const excluded = excludedEntity && !forProfitEligible;
  const keywordScore = scoreKeywords(normalized);

  return {
    forProfitEligible,
    smallBusinessEligible,
    excluded,
    keywordScore
  };
}

export function scoreKeywords(text: string): number {
  let score = 0;
  for (const keyword of KEYWORDS) {
    if (text.includes(keyword)) {
      score += keyword.split(" ").length;
    }
  }
  return score;
}

export function isAgencyExcluded(agency: string | null | undefined, filters: AgencyFilters): boolean {
  if (!agency) return false;
  const normalized = agency.toLowerCase();
  return filters.excludedBureaus.some((bureau) => normalized.includes(bureau));
}

export function agencyPriorityBoost(agency: string | null | undefined, filters: AgencyFilters): number {
  if (!agency) return 0;
  const normalized = agency.toLowerCase();
  return filters.priorityAgencies.some((item) => normalized.includes(item)) ? 1 : 0;
}
