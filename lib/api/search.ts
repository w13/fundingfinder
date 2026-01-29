import type { SavedSearch, SearchAnalyticsSummary } from "../domain/types";
import { getApiBaseUrl } from "../domain/constants";
import { getCorrelationHeaders, getCorrelationId } from "../domain/correlation";

const API_BASE_URL = getApiBaseUrl();

export async function fetchSavedSearches(): Promise<{ searches: SavedSearch[]; warning?: string }> {
  if (!API_BASE_URL) {
    return { searches: [], warning: "Set GRANT_SENTINEL_API_URL to your Worker API endpoint." };
  }
  try {
    const response = await fetch(new URL("/api/saved-searches", API_BASE_URL), { cache: "no-store", headers: getCorrelationHeaders() });
    if (!response.ok) {
      return { searches: [], warning: `API error ${response.status}` };
    }
    const payload = (await response.json()) as { searches: SavedSearch[] };
    return { searches: payload.searches ?? [] };
  } catch (error) {
    return {
      searches: [],
      warning: `Failed to fetch saved searches: ${error instanceof Error ? error.message : "Unknown error"}`
    };
  }
}

export async function createSavedSearch(payload: {
  name: string;
  query?: string | null;
  source?: string | null;
  minScore?: number | null;
  mode?: "smart" | "exact" | "any" | null;
}): Promise<{ search?: SavedSearch; warning?: string }> {
  if (!API_BASE_URL) {
    return { warning: "Set GRANT_SENTINEL_API_URL to your Worker API endpoint." };
  }
  try {
    const response = await fetch(new URL("/api/saved-searches", API_BASE_URL), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getCorrelationHeaders() },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return { warning: `API error ${response.status}: ${errorText || "Unable to save search"}` };
    }
    const data = (await response.json()) as { search: SavedSearch };
    return { search: data.search };
  } catch (error) {
    return { warning: `Failed to save search: ${error instanceof Error ? error.message : "Unknown error"}` };
  }
}

export async function deleteSavedSearch(id: string): Promise<{ removed: boolean; warning?: string }> {
  if (!API_BASE_URL) {
    return { removed: false, warning: "Set GRANT_SENTINEL_API_URL to your Worker API endpoint." };
  }
  try {
    const response = await fetch(new URL("/api/saved-searches/delete", API_BASE_URL), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getCorrelationHeaders() },
      body: JSON.stringify({ id })
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return { removed: false, warning: `API error ${response.status}: ${errorText || "Unable to delete search"}` };
    }
    const data = (await response.json()) as { removed: boolean };
    return { removed: Boolean(data.removed) };
  } catch (error) {
    return { removed: false, warning: `Failed to delete search: ${error instanceof Error ? error.message : "Unknown error"}` };
  }
}

export async function logSearchClick(payload: {
  query?: string | null;
  sourceFilter?: string | null;
  minScore?: number | null;
  mode?: "smart" | "exact" | "any" | null;
  opportunityId: string;
  source: string;
  resultId?: string | null;
  position?: number | null;
  correlationId?: string | null;
}): Promise<void> {
  if (!API_BASE_URL) return;
  const correlationId = payload.correlationId ?? getCorrelationId();
  try {
    const url = new URL("/api/search-events", API_BASE_URL);
    const body = JSON.stringify({ ...payload, correlationId });
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(url.toString(), blob);
      return;
    }
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getCorrelationHeaders() },
      body,
      keepalive: true
    });
  } catch {
    // Silently ignore analytics errors
  }
}

export async function fetchSearchAnalytics(): Promise<{ analytics: SearchAnalyticsSummary | null; warning?: string }> {
  if (!API_BASE_URL) {
    return { analytics: null, warning: "Set GRANT_SENTINEL_API_URL to your Worker API endpoint." };
  }
  try {
    const response = await fetch(new URL("/api/admin/search-analytics", API_BASE_URL), { cache: "no-store", headers: getCorrelationHeaders() });
    if (!response.ok) {
      return { analytics: null, warning: `API error ${response.status}` };
    }
    const payload = (await response.json()) as { analytics: SearchAnalyticsSummary };
    return { analytics: payload.analytics ?? null };
  } catch (error) {
    return { analytics: null, warning: `Failed to fetch analytics: ${error instanceof Error ? error.message : "Unknown error"}` };
  }
}
