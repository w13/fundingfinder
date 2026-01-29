import { z } from "zod";
import type { Env } from "../types";
import { authorize } from "../utils/auth";
import { jsonResponse } from "../utils/response";
import { isIntegrationType } from "../types";
import {
  getAdminSummary,
  listFundingSources,
  updateFundingSource,
  listExclusionRules,
  insertExclusionRule,
  disableExclusionRule,
  toggleAllFundingSources
} from "../db";
import { insertTask } from "../db/tasks";
import { runSourceSync, runSync } from "../jobs/sync";
import { processPendingTasks } from "../jobs/scheduler";

const updateSourceSchema = z.object({
  integrationType: z.string().optional(),
  autoUrl: z.string().nullable().optional(),
  active: z.boolean().optional()
});

const syncSourceSchema = z.object({
  url: z.string().optional(),
  maxNotices: z.number().optional()
});

const addExclusionSchema = z.object({
  ruleType: z.enum(["excluded_bureau", "priority_agency"]),
  value: z.string().min(1).max(255)
});

export async function handleAdminRoutes(request: Request, env: Env, ctx: ExecutionContext, url: URL): Promise<Response | null> {
  if (!url.pathname.startsWith("/api/admin")) return null;

  if (request.method !== "GET" && !authorize(request, env)) {
    return jsonResponse({ error: "Unauthorized" }, 401, request);
  }

  if (url.pathname === "/api/admin/summary" && request.method === "GET") {
    const summary = await getAdminSummary(env.DB);
    return jsonResponse({ summary }, 200, request);
  }

  if (url.pathname === "/api/admin/sources" && request.method === "GET") {
    const sources = await listFundingSources(env.DB, false);
    return jsonResponse({ sources }, 200, request);
  }

  if (url.pathname.startsWith("/api/admin/sources/") && request.method === "PATCH") {
    const id = url.pathname.split("/").pop();
    if (!id) return jsonResponse({ error: "Missing source id" }, 400, request);
    
    const bodyResult = updateSourceSchema.safeParse(await request.json().catch(() => ({})));
    if (!bodyResult.success) {
      return jsonResponse({ error: bodyResult.error.format() }, 400, request);
    }
    const { integrationType, autoUrl, active } = bodyResult.data;

    if (integrationType && !isIntegrationType(integrationType)) {
      return jsonResponse({ error: "Unsupported integrationType" }, 400, request);
    }
    const updated = await updateFundingSource(env.DB, id, {
      integrationType: isIntegrationType(integrationType) ? integrationType : undefined,
      autoUrl,
      active
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
    
    await insertTask(env.DB, "sync_source", { sourceId: id, options: bodyResult.data });
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
    ctx.waitUntil(runSync(env, ctx, false));
    return jsonResponse({ status: "started" }, 202, request);
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
