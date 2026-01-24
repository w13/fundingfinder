import type { OpportunityDetail, OpportunitySearchResponse } from "./types";
import { getApiBaseUrl } from "./constants";

const API_BASE_URL = getApiBaseUrl();

export async function fetchOpportunities(params: {
  query?: string;
  source?: string;
  minScore?: string;
  limit?: number;
  mode?: "smart" | "exact" | "any";
}): Promise<OpportunitySearchResponse> {
  if (!API_BASE_URL) {
    return {
      items: [],
      warning: "Set GRANT_SENTINEL_API_URL to your Worker API endpoint."
    };
  }

  const url = new URL("/api/opportunities", API_BASE_URL);
  if (params.query) url.searchParams.set("query", params.query);
  if (params.source) url.searchParams.set("source", params.source);
  if (params.minScore) url.searchParams.set("minScore", params.minScore);
  if (typeof params.limit === "number") url.searchParams.set("limit", params.limit.toString());
  if (params.mode) url.searchParams.set("mode", params.mode);

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    return {
      items: [],
      warning: `API error ${response.status}`
    };
  }

  const payload = (await response.json()) as OpportunitySearchResponse;
  return {
    items: payload.items ?? [],
    warning: payload.warning
  };
}

export async function fetchOpportunityById(id: string): Promise<OpportunityDetail | null> {
  if (!API_BASE_URL) return null;
  const url = new URL(`/api/opportunities/${id}`, API_BASE_URL);
  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) return null;
  const payload = (await response.json()) as { item?: OpportunityDetail };
  return payload.item ?? null;
}
