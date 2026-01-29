import { getApiBaseUrl } from "../domain/constants";
import { getCorrelationHeaders } from "../domain/correlation";

const API_BASE_URL = getApiBaseUrl();

export type HealthCheck = {
  ok: boolean;
  message?: string;
};

export type HealthStatus = {
  status: "ok" | "degraded";
  checks: Record<string, HealthCheck>;
  timestamp?: string;
  correlationId?: string | null;
};

export async function fetchHealthStatus(): Promise<{ health: HealthStatus | null; warning?: string }> {
  if (!API_BASE_URL) {
    return { health: null, warning: "Set GRANT_SENTINEL_API_URL to your Worker API endpoint." };
  }
  try {
    const response = await fetch(new URL("/health", API_BASE_URL), { cache: "no-store", headers: getCorrelationHeaders() });
    if (!response.ok) {
      return { health: null, warning: `API error ${response.status}` };
    }
    const payload = (await response.json()) as HealthStatus;
    return { health: payload };
  } catch (error) {
    return { health: null, warning: `Failed to fetch health status: ${error instanceof Error ? error.message : "Unknown error"}` };
  }
}
