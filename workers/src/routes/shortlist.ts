import { z } from "zod";
import type { Env } from "../types";
import { authorize } from "../utils/auth";
import { jsonResponse } from "../utils/response";
import {
  listShortlist,
  addShortlist,
  removeShortlist,
  removeShortlistByOpportunity
} from "../db";
import { runShortlistAnalysis } from "../jobs/sync";

const addShortlistSchema = z.object({
  opportunityId: z.string().min(1),
  source: z.string().min(1)
});

const removeShortlistSchema = z.object({
  shortlistId: z.string().optional(),
  opportunityId: z.string().optional(),
  source: z.string().optional()
});

const analyzeShortlistSchema = z.object({
  shortlistIds: z.array(z.string()).optional()
});

export async function handleShortlistRoutes(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  url: URL
): Promise<Response | null> {
  if (!url.pathname.startsWith("/api/shortlist")) return null;

  if (request.method !== "GET" && !authorize(request, env)) {
    return jsonResponse({ error: "Unauthorized" }, 401, request);
  }

  if (url.pathname === "/api/shortlist" && request.method === "GET") {
    const items = await listShortlist(env.DB);
    return jsonResponse({ items }, 200, request);
  }

  if (url.pathname === "/api/shortlist" && request.method === "POST") {
    const bodyResult = addShortlistSchema.safeParse(await request.json().catch(() => ({})));
    if (!bodyResult.success) {
      return jsonResponse({ error: bodyResult.error.format() }, 400, request);
    }
    
    const result = await addShortlist(env.DB, bodyResult.data.opportunityId, bodyResult.data.source);
    return jsonResponse({ id: result.id, created: result.created }, 201, request);
  }

  if (url.pathname === "/api/shortlist/remove" && request.method === "POST") {
    const bodyResult = removeShortlistSchema.safeParse(await request.json().catch(() => ({})));
    if (!bodyResult.success) {
       return jsonResponse({ error: bodyResult.error.format() }, 400, request);
    }
    const { shortlistId, opportunityId, source } = bodyResult.data;

    let removed = false;
    if (shortlistId) {
      removed = await removeShortlist(env.DB, shortlistId);
    } else if (opportunityId && source) {
      removed = await removeShortlistByOpportunity(env.DB, opportunityId, source);
    } else {
      return jsonResponse({ error: "Missing shortlistId or opportunityId/source" }, 400, request);
    }
    return jsonResponse({ removed }, 200, request);
  }

  if (url.pathname === "/api/shortlist/analyze" && request.method === "POST") {
    const bodyResult = analyzeShortlistSchema.safeParse(await request.json().catch(() => ({})));
    if (!bodyResult.success) {
       return jsonResponse({ error: bodyResult.error.format() }, 400, request);
    }

    ctx.waitUntil(runShortlistAnalysis(env, ctx, bodyResult.data.shortlistIds));
    return jsonResponse({ status: "started" }, 202, request);
  }

  return null;
}
