import type { AgencyFilters, EligibilityResult } from "../filters";
import { agencyPriorityBoost, evaluateEligibility, isAgencyExcluded, scoreKeywords } from "../filters";
import type { OpportunityRecord, SourceSystem } from "../types";
import { hashPayload, hashText, normalizeText } from "../utils";

export interface NormalizedInput {
  source: SourceSystem;
  opportunityId: string;
  title: string;
  agency: string | null;
  bureau: string | null;
  status: string | null;
  summary: string | null;
  eligibility: string | null;
  postedDate: string | null;
  dueDate: string | null;
  url: string | null;
  rawPayload: unknown;
}

export interface NormalizationResult {
  record: OpportunityRecord;
  eligibility: EligibilityResult;
  eligibleForDeepDive: boolean;
}

export async function buildOpportunityRecord(input: NormalizedInput, filters: AgencyFilters): Promise<NormalizationResult | null> {
  if (!input.opportunityId || !input.title) return null;

  const combined = normalizeText(`${input.title} ${input.summary ?? ""} ${input.eligibility ?? ""}`);
  if (isAgencyExcluded(input.agency, filters)) return null;

  const eligibility = evaluateEligibility(input.eligibility);
  const keywordScore = scoreKeywords(combined) + agencyPriorityBoost(input.agency, filters);
  const versionHash = await hashRaw(input.rawPayload);

  const record: OpportunityRecord = {
    id: crypto.randomUUID(),
    opportunityId: input.opportunityId,
    source: input.source,
    title: normalizeText(input.title),
    agency: input.agency ? normalizeText(input.agency) : null,
    bureau: input.bureau ? normalizeText(input.bureau) : null,
    status: input.status ? normalizeText(input.status) : null,
    summary: input.summary ? normalizeText(input.summary) : null,
    eligibility: input.eligibility ? normalizeText(input.eligibility) : null,
    forProfitEligible: eligibility.forProfitEligible,
    smallBusinessEligible: eligibility.smallBusinessEligible,
    keywordScore,
    postedDate: input.postedDate ? normalizeText(input.postedDate) : null,
    dueDate: input.dueDate ? normalizeText(input.dueDate) : null,
    url: input.url ? normalizeText(input.url) : null,
    version: 1,
    versionHash,
    rawPayload: input.rawPayload
  };

  const eligibleForDeepDive = eligibility.forProfitEligible && !eligibility.excluded && keywordScore > 0;

  return {
    record,
    eligibility,
    eligibleForDeepDive
  };
}

async function hashRaw(rawPayload: unknown): Promise<string> {
  if (typeof rawPayload === "string") {
    return hashText(rawPayload);
  }
  return hashPayload(rawPayload);
}
