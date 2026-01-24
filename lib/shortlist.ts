import type { ShortlistItem } from "./types";
import { getApiBaseUrl } from "./constants";

const API_BASE_URL = getApiBaseUrl();

export async function fetchShortlist(): Promise<{ items: ShortlistItem[]; warning?: string }> {
  if (!API_BASE_URL) {
    return { items: [], warning: "Set GRANT_SENTINEL_API_URL to your Worker API endpoint." };
  }
  const response = await fetch(new URL("/api/shortlist", API_BASE_URL), { cache: "no-store" });
  if (!response.ok) {
    return { items: [], warning: `API error ${response.status}` };
  }
  const payload = (await response.json()) as { items: ShortlistItem[] };
  return { items: payload.items ?? [] };
}

export async function addShortlist(opportunityId: string, source: string): Promise<boolean> {
  if (!API_BASE_URL) return false;
  const response = await fetch(new URL("/api/shortlist", API_BASE_URL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ opportunityId, source })
  });
  return response.ok;
}

export async function removeShortlist(shortlistId: string): Promise<boolean> {
  if (!API_BASE_URL) return false;
  const response = await fetch(new URL("/api/shortlist/remove", API_BASE_URL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shortlistId })
  });
  return response.ok;
}

export async function analyzeShortlist(shortlistIds?: string[]): Promise<boolean> {
  if (!API_BASE_URL) return false;
  const response = await fetch(new URL("/api/shortlist/analyze", API_BASE_URL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shortlistIds })
  });
  return response.ok;
}
