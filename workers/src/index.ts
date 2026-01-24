import type { Env, PdfJob } from "./types";
import { isIntegrationType } from "./types";
import { syncGrantsGov } from "./connectors/grantsGov";
import { syncSamGov } from "./connectors/samGov";
import { syncHrsa } from "./connectors/hrsa";
import { syncFundingSource } from "./connectors/sourceRegistry";
import {
  upsertOpportunity,
  listOpportunities,
  getOpportunityById,
  insertDocument,
  insertAnalysis,
  listShortlist,
  addShortlist,
  removeShortlist,
  removeShortlistByOpportunity,
  listShortlistForAnalysis,
  listExclusionRules,
  insertExclusionRule,
  disableExclusionRule,
  getAdminSummary,
  listFundingSources,
  getFundingSource,
  updateFundingSource,
  updateFundingSourceSync
} from "./db";
import { resolvePdfLinks } from "./processing/browser";
import { ingestPdf } from "./processing/pdf";
import { analyzeFeasibility } from "./analysis/feasibility";
import { indexOpportunity } from "./analysis/vectorize";
import { sendDailyBrief } from "./notifications";

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runSync(env, ctx));
  },

  async queue(batch: MessageBatch<PdfJob>, env: Env, ctx: ExecutionContext): Promise<void> {
    for (const message of batch.messages) {
      try {
        await processPdfJob(env, ctx, message.body);
      } catch (error) {
        console.error("pdf job failed", error);
        message.retry();
      }
    }
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "") {
      return jsonResponse({
        name: "Grant Sentinel API",
        version: "1.0.0",
        endpoints: {
          health: "GET /health",
          opportunities: "GET /api/opportunities?query=&source=&minScore=&limit=&mode=",
          opportunityDetail: "GET /api/opportunities/:id",
          sources: "GET /api/sources",
          shortlist: {
            list: "GET /api/shortlist",
            add: "POST /api/shortlist",
            remove: "POST /api/shortlist/remove",
            analyze: "POST /api/shortlist/analyze"
          },
          admin: {
            summary: "GET /api/admin/summary",
            sources: "GET /api/admin/sources",
            updateSource: "PATCH /api/admin/sources/:id",
            syncSource: "POST /api/admin/sources/:id/sync",
            exclusions: "GET /api/admin/exclusions",
            addExclusion: "POST /api/admin/exclusions",
            deleteExclusion: "DELETE /api/admin/exclusions/:id",
            runSync: "POST /api/admin/run-sync"
          }
        }
      });
    }

    if (url.pathname === "/health") {
      return jsonResponse({ status: "ok" });
    }

    const opportunityResponse = await handleOpportunities(request, env, url);
    if (opportunityResponse) return opportunityResponse;

    const adminResponse = await handleAdminRoutes(request, env, ctx, url);
    if (adminResponse) return adminResponse;

    const sourceResponse = await handleSources(request, env);
    if (sourceResponse) return sourceResponse;

    const shortlistResponse = await handleShortlistRoutes(request, env, ctx, url);
    if (shortlistResponse) return shortlistResponse;

    const opportunityDetail = await handleOpportunityDetail(request, env, url);
    if (opportunityDetail) return opportunityDetail;

    return jsonResponse({ error: "Not found" }, 404);
  }
};

async function handleOpportunities(request: Request, env: Env, url: URL): Promise<Response | null> {
  if (url.pathname !== "/api/opportunities" || request.method !== "GET") return null;
  const query = url.searchParams.get("query") ?? undefined;
  const source = url.searchParams.get("source") ?? undefined;
  const minScore = toNumber(url.searchParams.get("minScore"));
  const limit = toNumber(url.searchParams.get("limit")) ?? 50;
  const mode = url.searchParams.get("mode") ?? undefined;
  const items = await listOpportunities(env.DB, {
    query,
    source: source ?? undefined,
    minScore: minScore ?? undefined,
    limit,
    mode: mode === "exact" || mode === "any" ? mode : "smart"
  });
  return jsonResponse({ items });
}

async function handleOpportunityDetail(request: Request, env: Env, url: URL): Promise<Response | null> {
  if (!url.pathname.startsWith("/api/opportunities/") || request.method !== "GET") return null;
  const id = url.pathname.split("/").pop();
  if (!id) return jsonResponse({ error: "Missing id" }, 400);
  const item = await getOpportunityById(env.DB, id);
  if (!item) return jsonResponse({ error: "Not found" }, 404);
  return jsonResponse({ item });
}

async function handleSources(request: Request, env: Env): Promise<Response | null> {
  if (request.method !== "GET") return null;
  const url = new URL(request.url);
  if (url.pathname !== "/api/sources") return null;
  const sources = await listFundingSources(env.DB, true);
  return jsonResponse({
    sources: sources.map((source) => ({
      id: source.id,
      name: source.name,
      country: source.country,
      homepage: source.homepage
    }))
  });
}

async function handleAdminRoutes(request: Request, env: Env, ctx: ExecutionContext, url: URL): Promise<Response | null> {
  if (!url.pathname.startsWith("/api/admin")) return null;

  if (url.pathname === "/api/admin/summary" && request.method === "GET") {
    const summary = await getAdminSummary(env.DB);
    return jsonResponse({ summary });
  }

  if (url.pathname === "/api/admin/sources" && request.method === "GET") {
    const sources = await listFundingSources(env.DB, false);
    return jsonResponse({ sources });
  }

  if (url.pathname.startsWith("/api/admin/sources/") && request.method === "PATCH") {
    const id = url.pathname.split("/").pop();
    if (!id) return jsonResponse({ error: "Missing source id" }, 400);
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return jsonResponse({ error: "Invalid payload" }, 400);
    }
    const { integrationType, autoUrl, active } = body as {
      integrationType?: string;
      autoUrl?: string | null;
      active?: boolean;
    };
    if (integrationType && !isIntegrationType(integrationType)) {
      return jsonResponse({ error: "Unsupported integrationType" }, 400);
    }
    const updated = await updateFundingSource(env.DB, id, {
      integrationType: integrationType ?? undefined,
      autoUrl: typeof autoUrl === "string" ? autoUrl.trim() || null : autoUrl,
      active: typeof active === "boolean" ? active : undefined
    });
    return jsonResponse({ updated });
  }

  if (url.pathname.startsWith("/api/admin/sources/") && url.pathname.endsWith("/sync") && request.method === "POST") {
    const id = url.pathname.split("/").slice(-2)[0];
    if (!id) return jsonResponse({ error: "Missing source id" }, 400);
    const body = await request.json().catch(() => null);
    const urlOverride = typeof body?.url === "string" ? body.url : undefined;
    const maxNotices = typeof body?.maxNotices === "number" ? body.maxNotices : undefined;
    ctx.waitUntil(runSourceSync(env, ctx, id, { url: urlOverride, maxNotices }));
    return jsonResponse({ status: "started" }, 202);
  }

  if (url.pathname === "/api/admin/exclusions" && request.method === "GET") {
    const activeOnly = url.searchParams.get("active") !== "false";
    const rules = await listExclusionRules(env.DB, activeOnly);
    return jsonResponse({ rules });
  }

  if (url.pathname === "/api/admin/exclusions" && request.method === "POST") {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return jsonResponse({ error: "Invalid payload" }, 400);
    }
    const ruleType = (body as { ruleType?: string }).ruleType;
    const value = (body as { value?: string }).value;
    if (!ruleType || !value) {
      return jsonResponse({ error: "Missing ruleType or value" }, 400);
    }
    const cleanedValue = String(value).trim();
    if (!cleanedValue) {
      return jsonResponse({ error: "Empty value" }, 400);
    }
    if (ruleType !== "excluded_bureau" && ruleType !== "priority_agency") {
      return jsonResponse({ error: "Unsupported ruleType" }, 400);
    }
    const rule = await insertExclusionRule(env.DB, ruleType, cleanedValue);
    return jsonResponse({ rule }, 201);
  }

  if (url.pathname.startsWith("/api/admin/exclusions/") && request.method === "DELETE") {
    const id = url.pathname.split("/").pop();
    if (!id) return jsonResponse({ error: "Missing rule id" }, 400);
    const updated = await disableExclusionRule(env.DB, id);
    return jsonResponse({ disabled: updated });
  }

  if (url.pathname === "/api/admin/run-sync" && request.method === "POST") {
    ctx.waitUntil(runSync(env, ctx));
    return jsonResponse({ status: "started" }, 202);
  }

  return null;
}

async function handleShortlistRoutes(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  url: URL
): Promise<Response | null> {
  if (!url.pathname.startsWith("/api/shortlist")) return null;

  if (url.pathname === "/api/shortlist" && request.method === "GET") {
    const items = await listShortlist(env.DB);
    return jsonResponse({ items });
  }

  if (url.pathname === "/api/shortlist" && request.method === "POST") {
    const body = await request.json().catch(() => null);
    const opportunityId = typeof body?.opportunityId === "string" ? body.opportunityId.trim() : "";
    const source = typeof body?.source === "string" ? body.source.trim() : "";
    if (!opportunityId || !source) {
      return jsonResponse({ error: "Missing opportunityId or source" }, 400);
    }
    const result = await addShortlist(env.DB, opportunityId, source);
    return jsonResponse({ id: result.id, created: result.created }, 201);
  }

  if (url.pathname === "/api/shortlist/remove" && request.method === "POST") {
    const body = await request.json().catch(() => null);
    const shortlistId = typeof body?.shortlistId === "string" ? body.shortlistId.trim() : "";
    const opportunityId = typeof body?.opportunityId === "string" ? body.opportunityId.trim() : "";
    const source = typeof body?.source === "string" ? body.source.trim() : "";
    let removed = false;
    if (shortlistId) {
      removed = await removeShortlist(env.DB, shortlistId);
    } else if (opportunityId && source) {
      removed = await removeShortlistByOpportunity(env.DB, opportunityId, source);
    } else {
      return jsonResponse({ error: "Missing shortlistId or opportunityId/source" }, 400);
    }
    return jsonResponse({ removed });
  }

  if (url.pathname === "/api/shortlist/analyze" && request.method === "POST") {
    const body = await request.json().catch(() => null);
    const shortlistIds = Array.isArray(body?.shortlistIds)
      ? body.shortlistIds.filter((id: unknown) => typeof id === "string")
      : undefined;
    ctx.waitUntil(runShortlistAnalysis(env, ctx, shortlistIds));
    return jsonResponse({ status: "started" }, 202);
  }

  return null;
}

async function runSync(env: Env, ctx: ExecutionContext): Promise<void> {
  const sources = [syncGrantsGov, syncSamGov, syncHrsa];
  const pdfJobs: PdfJob[] = [];
  const updated = new Map<string, boolean>();
  const rules = await listExclusionRules(env.DB, true);

  for (const sourceSync of sources) {
    const { records, pdfJobs: newJobs } = await sourceSync(env, ctx, rules);
    for (const record of records) {
      const result = await upsertOpportunity(env.DB, record);
      updated.set(`${record.source}:${record.opportunityId}`, result.updated);
    }
    pdfJobs.push(...newJobs);
  }

  await syncCatalogSources(env, ctx, rules);

  for (const job of pdfJobs) {
    const key = `${job.source}:${job.opportunityId}`;
    if (!updated.get(key)) continue;
    await env.PDF_QUEUE.send(job);
  }

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

async function syncCatalogSources(env: Env, ctx: ExecutionContext, rules: Awaited<ReturnType<typeof listExclusionRules>>): Promise<void> {
  const sources = await listFundingSources(env.DB, true);
  for (const source of sources) {
    if (source.integrationType === "core_api") continue;
    if (source.integrationType === "manual_url" && !source.autoUrl) continue;
    await syncAndStoreSource(env, ctx, source, rules, {});
  }
}

async function runSourceSync(
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
    for (const record of records) {
      const result = await upsertOpportunity(env.DB, record);
      if (result.updated) ingested += 1;
    }
    await updateFundingSourceSync(env.DB, source.id, { status: "success", ingested });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await updateFundingSourceSync(env.DB, source.id, { status: "failed", error: message });
    console.error("source sync failed", source.id, error);
  }
}

async function runShortlistAnalysis(
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

async function processPdfJob(env: Env, ctx: ExecutionContext, job: PdfJob): Promise<void> {
  const pdfLinks = await resolvePdfLinks(env, job.detailUrl, job.documentUrls);
  const limited = pdfLinks.slice(0, 3);

  for (let index = 0; index < limited.length; index += 1) {
    const pdfUrl = limited[index];
    const result = await ingestPdf(env, pdfUrl, job.opportunityId, job.source);
    if (!result) continue;

    await insertDocument(env.DB, job.opportunityId, job.source, pdfUrl, result.r2Key, result.textExcerpt, result.sections);

    if (index === 0) {
      const analysis = await analyzeFeasibility(env, job.title, result.sections, result.fullText);
      await insertAnalysis(env.DB, job.opportunityId, job.source, analysis);
      await indexOpportunity(env, job.opportunityId, job.source, result.textExcerpt, {
        opportunityId: job.opportunityId,
        source: job.source
      });
    }
  }

  ctx.waitUntil(Promise.resolve());
}

function toNumber(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
