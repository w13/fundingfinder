import type { SourceOption } from "../domain/types";
import { getApiBaseUrl } from "../domain/constants";

const API_BASE_URL = getApiBaseUrl();

export async function fetchSourceOptions(): Promise<{ sources: SourceOption[]; warning?: string }> {
  if (!API_BASE_URL) {
    return { sources: [], warning: "Set GRANT_SENTINEL_API_URL to your Worker API endpoint." };
  }
  const response = await fetch(new URL("/api/sources", API_BASE_URL), { cache: "no-store" });
  if (!response.ok) {
    return { sources: [], warning: `API error ${response.status}` };
  }
  const payload = (await response.json()) as { sources: SourceOption[] };
  return { sources: payload.sources ?? [] };
}

