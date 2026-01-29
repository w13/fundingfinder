import { z } from "zod";
import type { Env } from "../types";
import { authorize } from "../utils/auth";
import { jsonResponse } from "../utils/response";
import { isIntegrationType } from "../types";
import {
  getAdminSummary,
  listFundingSources,
  insertFundingSource,
  updateFundingSource,
  listExclusionRules,
  insertExclusionRule,
  disableExclusionRule,
  toggleAllFundingSources,
  getPdfJobMetrics,
  getSourceHealthSummary,
  getSearchAnalyticsSummary,
  getNormalizationDiagnosticsSummary,
  listNotificationChannels,
  insertNotificationChannel,
  updateNotificationChannel,
  deleteNotificationChannel,
  listSearchBoosts,
  upsertSearchBoost,
  deleteSearchBoost,
  listFailedJobs
} from "../db";
import { insertTask } from "../db/tasks";
import { runSourceSync, runSync } from "../jobs/sync";
import { processPendingTasks } from "../jobs/scheduler";
import { syncFundingSource } from "../connectors/sourceRegistry";
import { getCorrelationId } from "../utils/correlation";

const updateSourceSchema = z.object({
  integrationType: z.string().optional(),
  autoUrl: z.string().nullable().optional(),
  active: z.boolean().optional(),
  maxNotices: z.number().nullable().optional(),
  keywordIncludes: z.string().nullable().optional(),
  keywordExcludes: z.string().nullable().optional(),
  language: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional()
});

const syncSourceSchema = z.object({
  url: z.string().optional(),
  maxNotices: z.number().optional()
});

const addExclusionSchema = z.object({
  ruleType: z.enum(["excluded_bureau", "priority_agency"]),
  value: z.string().min(1).max(255)
});

const createSourceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  country: z.string().optional().nullable(),
  homepage: z.string().optional().nullable(),
  integrationType: z.string().min(1),
  autoUrl: z.string().optional().nullable(),
  expectedResults: z.number().optional().nullable(),
  maxNotices: z.number().optional().nullable(),
  keywordIncludes: z.string().optional().nullable(),
  keywordExcludes: z.string().optional().nullable(),
  language: z.string().optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
  active: z.boolean().optional()
});

const previewSourceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  integrationType: z.string().min(1),
  autoUrl: z.string().optional().nullable(),
  expectedResults: z.number().optional().nullable(),
  maxNotices: z.number().optional().nullable(),
  url: z.string().optional().nullable()
});

const notificationSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["webhook", "slack", "email"]),
  config: z.record(z.unknown()),
  severityThreshold: z.enum(["low", "medium", "high", "critical"]).default("high"),
  active: z.boolean().default(true)
});

const notificationUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  type: z.enum(["webhook", "slack", "email"]).optional(),
  config: z.record(z.unknown()).optional(),
  severityThreshold: z.enum(["low", "medium", "high", "critical"]).optional(),
  active: z.boolean().optional()
});

const searchBoostSchema = z.object({
  entityType: z.enum(["source", "agency"]),
  entityValue: z.string().min(1),
  boost: z.number()
});

export async function handleAdminRoutes(request: Request, env: Env, ctx: ExecutionContext, url: URL): Promise<Response | null> {
  if (!url.pathname.startsWith("/api/admin")) return null;

  const correlationId = getCorrelationId(request);

  if (request.method !== "GET" && !authorize(request, env)) {
    return jsonResponse({ error: "Unauthorized" }, 401, request, correlationId);
  }

  if (url.pathname === "/api/admin/setup" && request.method === "GET") {
    return jsonResponse({ adminKeyConfigured: Boolean(env.ADMIN_API_KEY) }, 200, request);
  }

  if (url.pathname === "/api/admin/overview" && request.method === "GET") {
    const [summary, sources, rules, sourceHealth, pdfMetrics] = await Promise.all([
      getAdminSummary(env.DB),
      listFundingSources(env.DB, false),
      listExclusionRules(env.DB, true),
      getSourceHealthSummary(env.DB),
      getPdfJobMetrics(env.DB)
    ]);
    return jsonResponse({ summary, sources, rules, sourceHealth, pdfMetrics, adminKeyConfigured: Boolean(env.ADMIN_API_KEY) }, 200, request);
  }

  if (url.pathname === "/api/admin/search-analytics" && request.method === "GET") {
    const analytics = await getSearchAnalyticsSummary(env.DB);
    return jsonResponse({ analytics }, 200, request);
  }

  if (url.pathname === "/api/admin/diagnostics" && request.method === "GET") {
    const diagnostics = await getNormalizationDiagnosticsSummary(env.DB);
    return jsonResponse({ diagnostics }, 200, request);
  }

  if (url.pathname === "/api/admin/failed-jobs" && request.method === "GET") {
    const failed = await listFailedJobs(env.DB, 50);
    return jsonResponse({ failed }, 200, request);
  }

  if (url.pathname === "/api/admin/notifications" && request.method === "GET") {
    const channels = await listNotificationChannels(env.DB);
    return jsonResponse({ channels }, 200, request);
  }

  if (url.pathname === "/api/admin/notifications" && request.method === "POST") {
    const bodyResult = notificationSchema.safeParse(await request.json().catch(() => ({})));
    if (!bodyResult.success) {
      return jsonResponse({ error: bodyResult.error.format() }, 400, request);
    }
    const channel = await insertNotificationChannel(env.DB, bodyResult.data);
    return jsonResponse({ channel }, 201, request);
  }

  if (url.pathname === "/api/admin/notifications" && request.method === "PATCH") {
    const bodyResult = notificationUpdateSchema.safeParse(await request.json().catch(() => ({})));
    if (!bodyResult.success) {
      return jsonResponse({ error: bodyResult.error.format() }, 400, request);
    }
    const { id, ...updates } = bodyResult.data;
    const updated = await updateNotificationChannel(env.DB, id, updates);
    return jsonResponse({ updated }, 200, request);
  }

  if (url.pathname.startsWith("/api/admin/notifications/") && request.method === "DELETE") {
    const id = url.pathname.split("/").pop();
    if (!id) return jsonResponse({ error: "Missing notification id" }, 400, request);
    const deleted = await deleteNotificationChannel(env.DB, id);
    return jsonResponse({ deleted }, 200, request);
  }

  if (url.pathname === "/api/admin/search-boosts" && request.method === "GET") {
    const boosts = await listSearchBoosts(env.DB);
    return jsonResponse({ boosts }, 200, request);
  }

  if (url.pathname === "/api/admin/search-boosts" && request.method === "POST") {
    const bodyResult = searchBoostSchema.safeParse(await request.json().catch(() => ({})));
    if (!bodyResult.success) {
      return jsonResponse({ error: bodyResult.error.format() }, 400, request);
    }
    const boost = await upsertSearchBoost(env.DB, bodyResult.data);
    return jsonResponse({ boost }, 201, request);
  }

  if (url.pathname.startsWith("/api/admin/search-boosts/") && request.method === "DELETE") {
    const id = url.pathname.split("/").pop();
    if (!id) return jsonResponse({ error: "Missing boost id" }, 400, request);
    const deleted = await deleteSearchBoost(env.DB, id);
    return jsonResponse({ deleted }, 200, request);
  }

  if (url.pathname === "/api/admin/summary" && request.method === "GET") {
    const summary = await getAdminSummary(env.DB);
    return jsonResponse({ summary }, 200, request);
  }

  if (url.pathname === "/api/admin/sources" && request.method === "GET") {
    const sources = await listFundingSources(env.DB, false);
    return jsonResponse({ sources }, 200, request);
  }

  if (url.pathname === "/api/admin/sources" && request.method === "POST") {
    const bodyResult = createSourceSchema.safeParse(await request.json().catch(() => ({})));
    if (!bodyResult.success) {
      return jsonResponse({ error: bodyResult.error.format() }, 400, request);
    }
    const { integrationType, ...rest } = bodyResult.data;
    if (!isIntegrationType(integrationType)) {
      return jsonResponse({ error: "Unsupported integrationType" }, 400, request);
    }
    const created = await insertFundingSource(env.DB, {
      ...rest,
      integrationType
    });
    return jsonResponse({ created }, 201, request);
  }

  if (url.pathname === "/api/admin/sources/preview" && request.method === "POST") {
    const bodyResult = previewSourceSchema.safeParse(await request.json().catch(() => ({})));
    if (!bodyResult.success) {
      return jsonResponse({ error: bodyResult.error.format() }, 400, request);
    }
    const { integrationType, url: overrideUrl, ...rest } = bodyResult.data;
    if (!isIntegrationType(integrationType)) {
      return jsonResponse({ error: "Unsupported integrationType" }, 400, request);
    }
    const rules = await listExclusionRules(env.DB, true);
    const source = {
      id: rest.id,
      name: rest.name,
      country: null,
      homepage: null,
      integrationType,
      autoUrl: rest.autoUrl ?? null,
      expectedResults: rest.expectedResults ?? null,
      maxNotices: rest.maxNotices ?? null,
      keywordIncludes: null,
      keywordExcludes: null,
      language: null,
      metadata: null,
      active: true,
      lastSync: null,
      lastSuccessfulSync: null,
      lastStatus: null,
      lastError: null,
      lastIngested: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const records = await syncFundingSource(env, ctx, source, rules, {
      url: overrideUrl ?? source.autoUrl ?? undefined,
      maxNotices: rest.maxNotices ?? undefined
    });
    const sample = records.slice(0, 5).map((record) => ({
      opportunityId: record.opportunityId,
      title: record.title,
      agency: record.agency
    }));
    return jsonResponse({ sample, count: records.length }, 200, request);
  }

  if (url.pathname.startsWith("/api/admin/sources/") && request.method === "PATCH") {
    const id = url.pathname.split("/").pop();
    if (!id) return jsonResponse({ error: "Missing source id" }, 400, request);
    
    const bodyResult = updateSourceSchema.safeParse(await request.json().catch(() => ({})));
    if (!bodyResult.success) {
      return jsonResponse({ error: bodyResult.error.format() }, 400, request);
    }
    const { integrationType, autoUrl, active, maxNotices, keywordIncludes, keywordExcludes, language, metadata } = bodyResult.data;

    if (integrationType && !isIntegrationType(integrationType)) {
      return jsonResponse({ error: "Unsupported integrationType" }, 400, request);
    }
    const updated = await updateFundingSource(env.DB, id, {
      integrationType: isIntegrationType(integrationType) ? integrationType : undefined,
      autoUrl,
      active,
      maxNotices,
      keywordIncludes,
      keywordExcludes,
      language,
      metadata
    });
    return jsonResponse({ updated }, 200, request);
  }

  if (url.pathname.startsWith("/api/admin/sources/") && url.pathname.endsWith("/sync") && request.method === "POST") {
    const id = url.pathname.split("/").slice(-2)[0];
    if (!id) return jsonResponse({ error: "Missing source id" }, 400, request);

    const bodyResult = syncSourceSchema.safeParse(await request.json().catch(() => ({})));
    if (!bodyResult.success) {
      return jsonResponse({ error: bodyResult.error.format() }, 400, request);
    }
    
    await insertTask(env.DB, "sync_source", { sourceId: id, options: bodyResult.data, correlationId });
    ctx.waitUntil(processPendingTasks(env, ctx));
    return jsonResponse({ status: "queued" }, 202, request);
  }

  if (url.pathname === "/api/admin/exclusions" && request.method === "GET") {
    const activeOnly = url.searchParams.get("active") !== "false";
    const rules = await listExclusionRules(env.DB, activeOnly);
    return jsonResponse({ rules }, 200, request);
  }

  if (url.pathname === "/api/admin/exclusions" && request.method === "POST") {
    const bodyResult = addExclusionSchema.safeParse(await request.json().catch(() => ({})));
    if (!bodyResult.success) {
      return jsonResponse({ error: bodyResult.error.format() }, 400, request);
    }
    
    const rule = await insertExclusionRule(env.DB, bodyResult.data.ruleType, bodyResult.data.value);
    return jsonResponse({ rule }, 201, request);
  }

  if (url.pathname.startsWith("/api/admin/exclusions/") && request.method === "DELETE") {
    const id = url.pathname.split("/").pop();
    if (!id) return jsonResponse({ error: "Missing rule id" }, 400, request);
    const updated = await disableExclusionRule(env.DB, id);
    return jsonResponse({ disabled: updated }, 200, request);
  }

  if (url.pathname === "/api/admin/run-sync" && request.method === "POST") {
    ctx.waitUntil(runSync(env, ctx, false, correlationId));
    return jsonResponse({ status: "started", correlationId }, 202, request, correlationId);
  }

  if (url.pathname === "/api/admin/sources/toggle-all" && request.method === "POST") {
    const bodyResult = z.object({ active: z.boolean() }).safeParse(await request.json().catch(() => ({})));
    if (!bodyResult.success) {
      return jsonResponse({ error: bodyResult.error.format() }, 400, request);
    }
    const { active } = bodyResult.data;
    const updated = await toggleAllFundingSources(env.DB, active);
    return jsonResponse({ updated }, 200, request);
  }

  if (url.pathname === "/api/admin/cleanup-unknown" && request.method === "POST") {
    const bodyResult = z.object({ 
      source: z.string().optional(),
      title: z.string().optional(),
      agency: z.string().optional()
    }).safeParse(await request.json().catch(() => ({})));
    
    const source = bodyResult.success ? bodyResult.data.source : "prozorro_ua";
    const title = bodyResult.success ? bodyResult.data.title : "Untitled Tender";
    const agencyPattern = bodyResult.success ? bodyResult.data.agency : "%Unknown%";

    // Build WHERE clause for matching opportunities
    let whereClause = "WHERE source = ?";
    const params: unknown[] = [source];

    if (title) {
      whereClause += " AND title = ?";
      params.push(title);
    }

    if (agencyPattern) {
      whereClause += " AND (agency IS NULL OR agency LIKE ?)";
      params.push(agencyPattern);
    }

    // First, get the opportunity_ids and sources to delete (for cleaning related tables)
    const selectQuery = `SELECT opportunity_id, source FROM opportunities ${whereClause}`;
    const toDelete = await env.DB.prepare(selectQuery).bind(...params).all<{ opportunity_id: string; source: string }>();
    
    const deletedCount = toDelete.results?.length ?? 0;

    if (deletedCount > 0) {
      // Delete related data first
      for (const opp of toDelete.results) {
        // Delete shortlist entries
        await env.DB.prepare("DELETE FROM shortlist WHERE opportunity_id = ? AND source = ?")
          .bind(opp.opportunity_id, opp.source)
          .run();

        // Delete analyses
        await env.DB.prepare("DELETE FROM analyses WHERE opportunity_id = ? AND source = ?")
          .bind(opp.opportunity_id, opp.source)
          .run();

        // Delete documents
        await env.DB.prepare("DELETE FROM documents WHERE opportunity_id = ? AND source = ?")
          .bind(opp.opportunity_id, opp.source)
          .run();

        // Delete opportunity versions
        await env.DB.prepare("DELETE FROM opportunity_versions WHERE opportunity_id = ? AND source = ?")
          .bind(opp.opportunity_id, opp.source)
          .run();
      }

      // Finally, delete the opportunities themselves
      const deleteQuery = `DELETE FROM opportunities ${whereClause}`;
      await env.DB.prepare(deleteQuery).bind(...params).run();
    }

    return jsonResponse({ deleted: deletedCount }, 200, request);
  }

  return null;
}
