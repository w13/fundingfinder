import type { Env, PdfJob, SectionSlices } from "../types";
import { syncGrantsGov } from "../connectors/grantsGov";
import { syncSamGov } from "../connectors/samGov";
import { syncHrsa } from "../connectors/hrsa";
import { syncWorldBank } from "../connectors/worldBank";
import { syncProzorro } from "../connectors/prozorro";
import { syncContractsFinder } from "../connectors/contractsFinder";
import { syncAusTender } from "../connectors/ausTender";
import { syncChileCompra } from "../connectors/chileCompra";
import { syncFundingSource } from "../connectors/sourceRegistry";
import {
  upsertOpportunity,
  listOpportunities,
  insertDocument,
  insertAnalysis,
  listExclusionRules,
  listFundingSources,
  getFundingSource,
  updateFundingSourceSync,
  listShortlistForAnalysis
} from "../db";
import { resolvePdfLinks } from "../processing/browser";
import { ingestPdf } from "../processing/pdf";
import { analyzeFeasibility } from "../analysis/feasibility";
import { indexOpportunity } from "../analysis/vectorize";
import { sendDailyBrief } from "../notifications";

export async function runSync(env: Env, ctx: ExecutionContext, isScheduled = false): Promise<void> {
  const sources = [syncGrantsGov, syncSamGov, syncHrsa, syncWorldBank, syncProzorro, syncContractsFinder, syncAusTender, syncChileCompra];
  const pdfJobs: PdfJob[] = [];
  const updated = new Map<string, boolean>();
  const rules = await listExclusionRules(env.DB, true);

  for (const sourceSync of sources) {
    const { records, pdfJobs: newJobs } = await sourceSync(env, ctx, rules);
    
    const BATCH_SIZE = 10;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const chunk = records.slice(i, i + BATCH_SIZE);
      await Promise.all(chunk.map(async (record) => {
        const result = await upsertOpportunity(env.DB, record);
        updated.set(`${record.source}:${record.opportunityId}`, result.updated);
      }));
    }
    
    pdfJobs.push(...newJobs);
  }

  await syncCatalogSources(env, ctx, rules);

  for (const job of pdfJobs) {
    const key = `${job.source}:${job.opportunityId}`;
    if (!updated.get(key)) continue;
    await env.PDF_QUEUE.send(job);
  }

  if (isScheduled) {
    const briefItems = await listOpportunities(env.DB, { minScore: 80, limit: 5 });
    await sendDailyBrief(
      env,
      briefItems.map((item) => ({
        title: item.title,
        opportunityId: item.opportunityId,
        source: item.source,
        feasibilityScore: item.feasibilityScore ?? 0,
        url: null
      }))
    );
  }
}

async function syncCatalogSources(env: Env, ctx: ExecutionContext, rules: Awaited<ReturnType<typeof listExclusionRules>>): Promise<void> {
  const sources = await listFundingSources(env.DB, true);
  for (const source of sources) {
    if (source.integrationType === "core_api") continue;
    if (source.integrationType === "manual_url" && !source.autoUrl) continue;
    await syncAndStoreSource(env, ctx, source, rules, {});
  }
}

export async function runSourceSync(
  env: Env,
  ctx: ExecutionContext,
  sourceId: string,
  options: { url?: string; maxNotices?: number }
): Promise<void> {
  const rules = await listExclusionRules(env.DB, true);
  const source = await getFundingSource(env.DB, sourceId);
  if (!source) {
    console.warn("source not found", sourceId);
    return;
  }
  
  await updateFundingSourceSync(env.DB, source.id, { status: "syncing", error: null });
  
  await syncAndStoreSource(env, ctx, source, rules, options);
}

async function syncAndStoreSource(
  env: Env,
  ctx: ExecutionContext,
  source: Awaited<ReturnType<typeof getFundingSource>>,
  rules: Awaited<ReturnType<typeof listExclusionRules>>,
  options: { url?: string; maxNotices?: number }
): Promise<void> {
  if (!source) return;
  try {
    const records = await syncFundingSource(env, ctx, source, rules, options);
    let ingested = 0;
    
    const BATCH_SIZE = 10;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const chunk = records.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(chunk.map(record => upsertOpportunity(env.DB, record)));
      ingested += results.filter(r => r.updated).length;
    }

    await updateFundingSourceSync(env.DB, source.id, { status: "success", ingested });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await updateFundingSourceSync(env.DB, source.id, { status: "failed", error: message });
    console.error("source sync failed", source.id, error);
  }
}

export async function runShortlistAnalysis(
  env: Env,
  ctx: ExecutionContext,
  shortlistIds?: string[]
): Promise<void> {
  const candidates = await listShortlistForAnalysis(env.DB, shortlistIds);
  let analyzed = 0;
  let failed = 0;

  for (const candidate of candidates) {
    const sections = candidate.sectionMap ?? {
      programDescription: null,
      requirements: null,
      evaluationCriteria: null
    };
    const fallbackText = [candidate.textExcerpt, candidate.summary, candidate.eligibility].filter(Boolean).join(" ");
    if (!fallbackText) {
      failed += 1;
      continue;
    }

    try {
      const analysis = await analyzeFeasibility(env, candidate.title, sections, fallbackText);
      await insertAnalysis(env.DB, candidate.opportunityId, candidate.source, analysis);
      await indexOpportunity(env, candidate.opportunityId, candidate.source, fallbackText, {
        opportunityId: candidate.opportunityId,
        source: candidate.source
      });
      analyzed += 1;
    } catch (error) {
      console.error("shortlist analysis failed", candidate.opportunityId, error);
      failed += 1;
    }
  }

  ctx.waitUntil(Promise.resolve({ analyzed, failed }));
}

export async function processPdfJob(env: Env, ctx: ExecutionContext, job: PdfJob): Promise<void> {
  const pdfLinks = await resolvePdfLinks(env, job.detailUrl, job.documentUrls);
  const limited = pdfLinks.slice(0, 3);
  
  let combinedText = "";
  const collectedSections: SectionSlices[] = [];

  for (let index = 0; index < limited.length; index += 1) {
    const pdfUrl = limited[index];
    const result = await ingestPdf(env, pdfUrl, job.opportunityId, job.source);
    if (!result) continue;

    await insertDocument(env.DB, job.opportunityId, job.source, pdfUrl, result.r2Key, result.textExcerpt, result.sections);
    
    if (result.fullText) {
      combinedText += `--- Document ${index + 1} ---\n${result.fullText}\n\n`;
    }
    collectedSections.push(result.sections);
  }

  const mergedSections: SectionSlices = {
    programDescription: collectedSections.map(s => s.programDescription).filter(Boolean).join("\n\n"),
    requirements: collectedSections.map(s => s.requirements).filter(Boolean).join("\n\n"),
    evaluationCriteria: collectedSections.map(s => s.evaluationCriteria).filter(Boolean).join("\n\n")
  };

  if (combinedText.trim().length > 0) {
    const analysis = await analyzeFeasibility(env, job.title, mergedSections, combinedText.slice(0, 30000));
    await insertAnalysis(env.DB, job.opportunityId, job.source, analysis);
    await indexOpportunity(env, job.opportunityId, job.source, combinedText.slice(0, 2000), {
      opportunityId: job.opportunityId,
      source: job.source
    });
  }

  ctx.waitUntil(Promise.resolve());
}
