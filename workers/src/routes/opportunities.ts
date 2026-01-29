import type { Env } from "../types";
import { jsonResponse } from "../utils/response";
import {
  listOpportunities,
  getOpportunityById,
  listFundingSources
} from "../db";

function toNumber(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function clampScore(value: number | null): number | undefined {
  if (value === null) return undefined;
  return Math.max(0, Math.min(100, value));
}

type SearchMode = "smart" | "exact" | "any";

function isValidMode(mode: string | null): mode is SearchMode {
  return mode === "smart" || mode === "exact" || mode === "any";
}

export async function handleOpportunities(request: Request, env: Env, url: URL): Promise<Response | null> {
  if (url.pathname !== "/api/opportunities" || request.method !== "GET") return null;

  const query = url.searchParams.get("query") ?? undefined;
  const source = url.searchParams.get("source") ?? undefined;
  const rawMinScore = toNumber(url.searchParams.get("minScore"));
  const minScore = clampScore(rawMinScore);
  const limit = Math.min(Math.max(1, toNumber(url.searchParams.get("limit")) ?? 50), 500);
  const modeParam = url.searchParams.get("mode");
  const mode: SearchMode = isValidMode(modeParam) ? modeParam : "smart";

  const items = await listOpportunities(env.DB, {
    query,
    source: source ?? undefined,
    minScore,
    limit,
    mode
  });
  return jsonResponse({ items }, 200, request);
}

export async function handleOpportunityDetail(request: Request, env: Env, url: URL): Promise<Response | null> {
  if (!url.pathname.startsWith("/api/opportunities/") || request.method !== "GET") return null;
  const id = url.pathname.split("/").pop();
  if (!id) return jsonResponse({ error: "Missing id" }, 400, request);
  const item = await getOpportunityById(env.DB, id);
  if (!item) return jsonResponse({ error: "Not found" }, 404, request);
  return jsonResponse({ item }, 200, request);
}

export async function handleSources(request: Request, env: Env): Promise<Response | null> {
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
  }, 200, request);
}
