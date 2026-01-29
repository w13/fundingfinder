import { z } from "zod";
import type { Env } from "../types";
import { jsonResponse } from "../utils/response";
import { getCorrelationId } from "../utils/correlation";
import { deleteSavedSearch, insertSavedSearch, insertSearchClickEvent, listSavedSearches } from "../db";

const savedSearchSchema = z.object({
  name: z.string().min(1),
  query: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  minScore: z.number().optional().nullable(),
  mode: z.enum(["smart", "exact", "any"]).optional().nullable()
});

const deleteSavedSearchSchema = z.object({
  id: z.string().min(1)
});

const searchClickSchema = z.object({
  query: z.string().optional().nullable(),
  sourceFilter: z.string().optional().nullable(),
  minScore: z.number().optional().nullable(),
  mode: z.enum(["smart", "exact", "any"]).optional().nullable(),
  opportunityId: z.string().min(1),
  source: z.string().min(1),
  resultId: z.string().optional().nullable(),
  position: z.number().optional().nullable(),
  correlationId: z.string().optional().nullable()
});

export async function handleSavedSearchRoutes(request: Request, env: Env, url: URL): Promise<Response | null> {
  if (!url.pathname.startsWith("/api/saved-searches")) return null;

  if (url.pathname === "/api/saved-searches" && request.method === "GET") {
    const searches = await listSavedSearches(env.DB);
    return jsonResponse({ searches }, 200, request);
  }

  if (url.pathname === "/api/saved-searches" && request.method === "POST") {
    const bodyResult = savedSearchSchema.safeParse(await request.json().catch(() => ({})));
    if (!bodyResult.success) {
      return jsonResponse({ error: bodyResult.error.format() }, 400, request);
    }
    const search = await insertSavedSearch(env.DB, bodyResult.data);
    return jsonResponse({ search }, 201, request);
  }

  if (url.pathname === "/api/saved-searches/delete" && request.method === "POST") {
    const bodyResult = deleteSavedSearchSchema.safeParse(await request.json().catch(() => ({})));
    if (!bodyResult.success) {
      return jsonResponse({ error: bodyResult.error.format() }, 400, request);
    }
    const removed = await deleteSavedSearch(env.DB, bodyResult.data.id);
    return jsonResponse({ removed }, 200, request);
  }

  return null;
}

export async function handleSearchEventRoutes(request: Request, env: Env, url: URL): Promise<Response | null> {
  if (!url.pathname.startsWith("/api/search-events")) return null;

  if (url.pathname === "/api/search-events" && request.method === "POST") {
    const bodyResult = searchClickSchema.safeParse(await request.json().catch(() => ({})));
    if (!bodyResult.success) {
      return jsonResponse({ error: bodyResult.error.format() }, 400, request);
    }
    const event = await insertSearchClickEvent(env.DB, {
      ...bodyResult.data,
      correlationId: bodyResult.data.correlationId ?? getCorrelationId(request)
    });
    return jsonResponse({ event }, 201, request);
  }

  return null;
}
