import type { Env, AnalysisResult, SectionSlices } from "../types";
import { normalizeText, safeJsonParse } from "../utils";

const MODEL = "@cf/meta/llama-3.3-70b";

export async function analyzeFeasibility(
  env: Env,
  opportunityTitle: string,
  sections: SectionSlices,
  fallbackText: string
): Promise<AnalysisResult> {
  const companyProfile = normalizeText(env.COMPANY_PROFILE ?? "Private-sector digital health company focused on AI tooling.");
  const content = normalizeText(
    [sections.programDescription, sections.requirements, sections.evaluationCriteria, fallbackText].filter(Boolean).join(" ")
  );

  const prompt = [
    "You are Grant Sentinel, an analyst for private-sector grant eligibility.",
    "Return JSON only with fields:",
    "feasibility_score (0-100), suitability_score (0-100), profitability_score (0-100),",
    "summary_bullets (3 items), constraints (array).",
    "Suitability measures fit to the company profile (partnerships, eligibility, stack).",
    `Company profile: ${companyProfile}`,
    `Opportunity: ${opportunityTitle}`,
    `Grant text: ${content.slice(0, 6000)}`
  ].join("\n");

  const response = await env.AI.run(MODEL, {
    messages: [
      { role: "system", content: "Respond only with JSON." },
      { role: "user", content: prompt }
    ],
    max_tokens: 512
  });

  const text = extractText(response);
  const parsed = safeJsonParse<{
    feasibility_score?: number;
    suitability_score?: number;
    profitability_score?: number;
    summary_bullets?: string[];
    constraints?: string[];
  }>(text);

  return {
    feasibilityScore: clampScore(parsed?.feasibility_score),
    suitabilityScore: clampScore(parsed?.suitability_score ?? parsed?.feasibility_score),
    profitabilityScore: clampScore(parsed?.profitability_score),
    summaryBullets: normalizeBullets(parsed?.summary_bullets),
    constraints: normalizeBullets(parsed?.constraints),
    model: MODEL
  };
}

function extractText(response: unknown): string {
  if (typeof response === "string") return response;
  const record = response as Record<string, unknown>;
  if (typeof record.response === "string") return record.response;
  const choices = record.choices as Array<{ message?: { content?: string } }> | undefined;
  if (choices?.[0]?.message?.content) return choices[0].message?.content ?? "";
  return "";
}

function clampScore(value: number | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function normalizeBullets(value: string[] | undefined): string[] {
  if (!value) return [];
  return value.map((item) => normalizeText(item)).filter((item) => item.length > 0).slice(0, 5);
}
