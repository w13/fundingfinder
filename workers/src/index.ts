import type { Env, PdfJob } from "./types";
import { syncGrantsGov } from "./connectors/grantsGov";
import { syncSamGov } from "./connectors/samGov";
import { syncHrsa } from "./connectors/hrsa";
import {
  upsertOpportunity,
  listOpportunities,
  getOpportunityById,
  insertDocument,
  insertAnalysis,
  listExclusionRules,
  insertExclusionRule,
  disableExclusionRule,
  getAdminSummary
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

    if (url.pathname === "/health") {
      return jsonResponse({ status: "ok" });
    }

    if (url.pathname === "/api/opportunities" && request.method === "GET") {
      const query = url.searchParams.get("query") ?? undefined;
      const source = url.searchParams.get("source") ?? undefined;
      const minScore = toNumber(url.searchParams.get("minScore"));
      const limit = toNumber(url.searchParams.get("limit")) ?? 50;
      const items = await listOpportunities(env.DB, {
        query,
        source: source as "grants_gov" | "sam_gov" | "hrsa" | undefined,
        minScore: minScore ?? undefined,
        limit
      });
      return jsonResponse({ items });
    }

    if (url.pathname === "/api/admin/summary" && request.method === "GET") {
      const summary = await getAdminSummary(env.DB);
      return jsonResponse({ summary });
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

    if (url.pathname.startsWith("/api/opportunities/") && request.method === "GET") {
      const id = url.pathname.split("/").pop();
      if (!id) return jsonResponse({ error: "Missing id" }, 400);
      const item = await getOpportunityById(env.DB, id);
      if (!item) return jsonResponse({ error: "Not found" }, 404);
      return jsonResponse({ item });
    }

    return jsonResponse({ error: "Not found" }, 404);
  }
};

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
