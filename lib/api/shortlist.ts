import type { ShortlistItem } from "../domain/types";
import { getApiBaseUrl, getAuthHeaders } from "../domain/constants";

const API_BASE_URL = getApiBaseUrl();

export async function fetchShortlist(): Promise<{ items: ShortlistItem[]; warning?: string }> {
  if (!API_BASE_URL) {
    return { items: [], warning: "Set GRANT_SENTINEL_API_URL to your Worker API endpoint." };
  }
  try {
    const response = await fetch(new URL("/api/shortlist", API_BASE_URL), { cache: "no-store" });
    if (!response.ok) {
      return { items: [], warning: `API error ${response.status}` };
    }
    const payload = (await response.json()) as { items: ShortlistItem[] };

    // Ensure all items have required fields with defaults
    const items = (payload.items ?? []).map((item) => ({
      ...item,
      analysisSummary: Array.isArray(item.analysisSummary) ? item.analysisSummary : [],
      constraints: Array.isArray(item.constraints) ? item.constraints : [],
      analyzed: typeof item.analyzed === "boolean" ? item.analyzed : false
    }));

    return { items };
  } catch (error) {
    console.error("Error fetching shortlist:", error);
    return {
      items: [],
      warning: `Failed to fetch shortlist: ${error instanceof Error ? error.message : "Unknown error"}`
    };
  }
}

export async function addShortlist(opportunityId: string, source: string): Promise<boolean> {
  if (!API_BASE_URL) return false;
  const response = await fetch(new URL("/api/shortlist", API_BASE_URL), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify({ opportunityId, source })
  });
  return response.ok;
}

export async function removeShortlist(shortlistId: string): Promise<boolean> {
  if (!API_BASE_URL) return false;
  const response = await fetch(new URL("/api/shortlist/remove", API_BASE_URL), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify({ shortlistId })
  });
  return response.ok;
}

export async function analyzeShortlist(shortlistIds?: string[]): Promise<boolean> {
  if (!API_BASE_URL) return false;
  const response = await fetch(new URL("/api/shortlist/analyze", API_BASE_URL), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify({ shortlistIds })
  });
  return response.ok;
}

