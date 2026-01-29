import type { AgencyFilters, EligibilityResult } from "../filters";
import { agencyPriorityBoost, evaluateEligibility, isAgencyExcluded, scoreKeywords } from "../filters";
import type { NormalizationDiagnostics, OpportunityRecord, SourceSystem } from "../types";
import { hashPayload, hashText, normalizeDate, normalizeText } from "../utils";

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
  diagnostics: NormalizationDiagnostics;
}

export async function buildOpportunityRecord(input: NormalizedInput, filters: AgencyFilters): Promise<NormalizationResult | null> {
  if (!input.opportunityId || !input.title) return null;

  const combined = normalizeText(`${input.title} ${input.summary ?? ""} ${input.eligibility ?? ""}`);
  if (isAgencyExcluded(input.agency, filters)) return null;

  const eligibility = evaluateEligibility(input.eligibility);
  const keywordScore = scoreKeywords(combined) + agencyPriorityBoost(input.agency, filters);
  const versionHash = await hashRaw(input.rawPayload);

  const diagnostics = buildDiagnostics(input);

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
    postedDate: normalizeDate(input.postedDate),
    dueDate: normalizeDate(input.dueDate),
    url: input.url ? normalizeText(input.url) : null,
    version: 1,
    versionHash,
    rawPayload: input.rawPayload,
    diagnostics
  };

  const eligibleForDeepDive = eligibility.forProfitEligible && !eligibility.excluded && keywordScore > 0;

  return {
    record,
    eligibility,
    eligibleForDeepDive,
    diagnostics
  };
}

async function hashRaw(rawPayload: unknown): Promise<string> {
  if (typeof rawPayload === "string") {
    return hashText(rawPayload);
  }
  return hashPayload(rawPayload);
}

function buildDiagnostics(input: NormalizedInput): NormalizationDiagnostics {
  const missingFields: string[] = [];
  const guessedFields: string[] = [];

  if (!input.agency) missingFields.push("agency");
  if (!input.summary) missingFields.push("summary");
  if (!input.eligibility) missingFields.push("eligibility");
  if (!input.postedDate) missingFields.push("postedDate");
  if (!input.dueDate) missingFields.push("dueDate");
  if (!input.url) missingFields.push("url");
  if (!input.status) missingFields.push("status");

  const title = input.title.toLowerCase();
  if (title.includes("untitled")) guessedFields.push("title");
  if (input.opportunityId.toLowerCase().startsWith("ted-")) guessedFields.push("opportunityId");

  return {
    missingFields,
    guessedFields
  };
}
