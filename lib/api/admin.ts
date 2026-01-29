import type { AdminSummary, ExclusionRule, FundingSource } from "../domain/types";
import { getApiBaseUrl, getAuthHeaders } from "../domain/constants";

const API_BASE_URL = getApiBaseUrl();

export async function fetchAdminSummary(): Promise<{ summary: AdminSummary | null; warning?: string }> {
  if (!API_BASE_URL) {
    return { summary: null, warning: "Set GRANT_SENTINEL_API_URL to your Worker API endpoint." };
  }
  try {
    const response = await fetch(new URL("/api/admin/summary", API_BASE_URL), {
      cache: "no-store",
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return { summary: null, warning: `API error ${response.status}: ${errorText || "Unknown error"}` };
    }
    const payload = (await response.json()) as { summary: AdminSummary };
    return { summary: payload.summary };
  } catch (error) {
    return { summary: null, warning: `Failed to fetch summary: ${error instanceof Error ? error.message : "Unknown error"}` };
  }
}

export async function fetchExclusionRules(): Promise<{ rules: ExclusionRule[]; warning?: string }> {
  if (!API_BASE_URL) {
    return { rules: [], warning: "Set GRANT_SENTINEL_API_URL to your Worker API endpoint." };
  }
  try {
    const response = await fetch(new URL("/api/admin/exclusions", API_BASE_URL), {
      cache: "no-store",
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return { rules: [], warning: `API error ${response.status}: ${errorText || "Unknown error"}` };
    }
    const payload = (await response.json()) as { rules: ExclusionRule[] };
    return { rules: payload.rules ?? [] };
  } catch (error) {
    return { rules: [], warning: `Failed to fetch rules: ${error instanceof Error ? error.message : "Unknown error"}` };
  }
}

export async function fetchFundingSources(): Promise<{ sources: FundingSource[]; warning?: string }> {
  if (!API_BASE_URL) {
    return { sources: [], warning: "Set GRANT_SENTINEL_API_URL to your Worker API endpoint." };
  }
  try {
    // GET requests to admin endpoints don't require auth (per routes/admin.ts)
    // Only use auth headers if we're in a server context
    const headers: HeadersInit = {};
    if (typeof window === "undefined") {
      // Server-side: include auth headers
      Object.assign(headers, getAuthHeaders());
    }

    const response = await fetch(new URL("/api/admin/sources", API_BASE_URL), {
      cache: "no-store",
      headers
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return { sources: [], warning: `API error ${response.status}: ${errorText || "Unknown error"}` };
    }
    const payload = (await response.json()) as { sources: FundingSource[] };
    return { sources: payload.sources ?? [] };
  } catch (error) {
    return { sources: [], warning: `Failed to fetch sources: ${error instanceof Error ? error.message : "Unknown error"}` };
  }
}

export async function syncFundingSource(
  id: string,
  payload: { url?: string; maxNotices?: number }
): Promise<boolean> {
  if (!API_BASE_URL) return false;
  const response = await fetch(new URL(`/api/admin/sources/${id}/sync`, API_BASE_URL), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify(payload)
  });
  return response.ok;
}

export async function updateFundingSource(
  id: string,
  payload: { autoUrl?: string | null; integrationType?: FundingSource["integrationType"]; active?: boolean }
): Promise<boolean> {
  if (!API_BASE_URL) return false;
  const response = await fetch(new URL(`/api/admin/sources/${id}`, API_BASE_URL), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify(payload)
  });
  return response.ok;
}

export async function createExclusionRule(ruleType: ExclusionRule["ruleType"], value: string): Promise<boolean> {
  if (!API_BASE_URL) return false;
  const response = await fetch(new URL("/api/admin/exclusions", API_BASE_URL), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify({ ruleType, value })
  });
  return response.ok;
}

export async function disableExclusionRule(id: string): Promise<boolean> {
  if (!API_BASE_URL) return false;
  const response = await fetch(new URL(`/api/admin/exclusions/${id}`, API_BASE_URL), {
    method: "DELETE",
    headers: getAuthHeaders()
  });
  return response.ok;
}

export async function triggerIngestionSync(): Promise<boolean> {
  if (!API_BASE_URL) return false;
  const response = await fetch(new URL("/api/admin/run-sync", API_BASE_URL), {
    method: "POST",
    headers: getAuthHeaders()
  });
  return response.ok;
}

export async function toggleAllSources(active: boolean): Promise<boolean> {
  console.log(`[toggleAllSources] Starting - active=${active}, API_BASE_URL=${API_BASE_URL}`);

  if (!API_BASE_URL) {
    console.error("[toggleAllSources] API_BASE_URL is not set");
    return false;
  }

  try {
    const authHeaders = getAuthHeaders();
    const hasAuth = Object.keys(authHeaders).length > 0;

    console.log(`[toggleAllSources] Auth headers: ${hasAuth ? "present" : "missing"}`);

    if (!hasAuth) {
      console.warn("[toggleAllSources] ADMIN_API_KEY not set - API call may fail with 401 Unauthorized");
      console.warn("[toggleAllSources] To fix: Set ADMIN_API_KEY secret for the frontend worker: wrangler secret put ADMIN_API_KEY --name grant-sentinel-frontend");
    }

    const url = new URL("/api/admin/sources/toggle-all", API_BASE_URL);
    console.log(`[toggleAllSources] Calling: ${url.toString()}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders
      },
      body: JSON.stringify({ active })
    });

    console.log(`[toggleAllSources] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(`[toggleAllSources] Failed: ${response.status} ${errorText}`);

      if (response.status === 401) {
        console.error("[toggleAllSources] Authentication failed. Make sure ADMIN_API_KEY is set for the frontend worker.");
        console.error("[toggleAllSources] Run: wrangler secret put ADMIN_API_KEY --name grant-sentinel-frontend");
      }

      return false;
    }

    const result = await response.json().catch(() => ({}));
    console.log(`[toggleAllSources] Success: updated ${result.updated ?? 0} sources`);
    return true;
  } catch (error) {
    const errorDetails = {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    };
    console.error("[toggleAllSources] Exception:", errorDetails);
    return false;
  }
}

