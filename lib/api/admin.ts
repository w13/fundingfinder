import type {
  AdminSummary,
  ExclusionRule,
  FundingSource,
  NotificationChannel,
  PdfJobMetrics,
  SearchBoost,
  SourceHealthSummary,
  NormalizationDiagnosticsSummary
} from "../domain/types";
import { getApiBaseUrl, getAuthHeaders } from "../domain/constants";
import { getCorrelationHeaders } from "../domain/correlation";

const API_BASE_URL = getApiBaseUrl();

export async function fetchAdminSummary(): Promise<{ summary: AdminSummary | null; warning?: string }> {
  if (!API_BASE_URL) {
    return { summary: null, warning: "Set GRANT_SENTINEL_API_URL to your Worker API endpoint." };
  }
  try {
    const response = await fetch(new URL("/api/admin/summary", API_BASE_URL), {
      cache: "no-store",
      headers: { ...getAuthHeaders(), ...getCorrelationHeaders() }
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

export async function fetchAdminOverview(): Promise<{
  summary: AdminSummary | null;
  sources: FundingSource[];
  rules: ExclusionRule[];
  sourceHealth: SourceHealthSummary[];
  pdfMetrics: PdfJobMetrics | null;
  adminKeyConfigured?: boolean;
  warning?: string;
}> {
  if (!API_BASE_URL) {
    return { summary: null, sources: [], rules: [], sourceHealth: [], pdfMetrics: null, warning: "Set GRANT_SENTINEL_API_URL to your Worker API endpoint." };
  }
  try {
    const response = await fetch(new URL("/api/admin/overview", API_BASE_URL), {
      cache: "no-store",
      headers: { ...getAuthHeaders(), ...getCorrelationHeaders() }
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        summary: null,
        sources: [],
        rules: [],
        sourceHealth: [],
        pdfMetrics: null,
        warning: `API error ${response.status}: ${errorText || "Unknown error"}`
      };
    }
    const payload = (await response.json()) as {
      summary: AdminSummary;
      sources: FundingSource[];
      rules: ExclusionRule[];
      sourceHealth: SourceHealthSummary[];
      pdfMetrics: PdfJobMetrics;
      adminKeyConfigured?: boolean;
    };
    return {
      summary: payload.summary ?? null,
      sources: payload.sources ?? [],
      rules: payload.rules ?? [],
      sourceHealth: payload.sourceHealth ?? [],
      pdfMetrics: payload.pdfMetrics ?? null,
      adminKeyConfigured: payload.adminKeyConfigured
    };
  } catch (error) {
    return {
      summary: null,
      sources: [],
      rules: [],
      sourceHealth: [],
      pdfMetrics: null,
      warning: `Failed to fetch overview: ${error instanceof Error ? error.message : "Unknown error"}`
    };
  }
}

export async function fetchAdminSetup(): Promise<{ adminKeyConfigured: boolean; warning?: string }> {
  if (!API_BASE_URL) {
    return { adminKeyConfigured: false, warning: "Set GRANT_SENTINEL_API_URL to your Worker API endpoint." };
  }
  try {
    const response = await fetch(new URL("/api/admin/setup", API_BASE_URL), { cache: "no-store", headers: getCorrelationHeaders() });
    if (!response.ok) {
      return { adminKeyConfigured: false, warning: `API error ${response.status}` };
    }
    const payload = (await response.json()) as { adminKeyConfigured: boolean };
    return { adminKeyConfigured: Boolean(payload.adminKeyConfigured) };
  } catch (error) {
    return { adminKeyConfigured: false, warning: `Failed to fetch setup status: ${error instanceof Error ? error.message : "Unknown error"}` };
  }
}

export async function fetchExclusionRules(): Promise<{ rules: ExclusionRule[]; warning?: string }> {
  if (!API_BASE_URL) {
    return { rules: [], warning: "Set GRANT_SENTINEL_API_URL to your Worker API endpoint." };
  }
  try {
    const response = await fetch(new URL("/api/admin/exclusions", API_BASE_URL), {
      cache: "no-store",
      headers: { ...getAuthHeaders(), ...getCorrelationHeaders() }
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
    const headers: HeadersInit = { ...getCorrelationHeaders() };
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

export async function previewFundingSource(payload: {
  id: string;
  name: string;
  integrationType: FundingSource["integrationType"];
  autoUrl?: string | null;
  expectedResults?: number | null;
  maxNotices?: number | null;
  url?: string | null;
}): Promise<{ sample: Array<{ opportunityId: string; title: string; agency: string | null }>; count: number; warning?: string }> {
  if (!API_BASE_URL) {
    return { sample: [], count: 0, warning: "Set GRANT_SENTINEL_API_URL to your Worker API endpoint." };
  }
  const response = await fetch(new URL("/api/admin/sources/preview", API_BASE_URL), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...getCorrelationHeaders()
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    return { sample: [], count: 0, warning: `API error ${response.status}: ${errorText || "Unknown error"}` };
  }
  const data = (await response.json()) as { sample: Array<{ opportunityId: string; title: string; agency: string | null }>; count: number };
  return { sample: data.sample ?? [], count: data.count ?? 0 };
}

export async function createFundingSource(payload: {
  id: string;
  name: string;
  country?: string | null;
  homepage?: string | null;
  integrationType: FundingSource["integrationType"];
  autoUrl?: string | null;
  expectedResults?: number | null;
  maxNotices?: number | null;
  keywordIncludes?: string | null;
  keywordExcludes?: string | null;
  language?: string | null;
  metadata?: Record<string, unknown> | null;
  active?: boolean;
}): Promise<{ created: boolean; warning?: string }> {
  if (!API_BASE_URL) {
    return { created: false, warning: "Set GRANT_SENTINEL_API_URL to your Worker API endpoint." };
  }
  const response = await fetch(new URL("/api/admin/sources", API_BASE_URL), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...getCorrelationHeaders()
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    return { created: false, warning: `API error ${response.status}: ${errorText || "Unknown error"}` };
  }
  const data = (await response.json()) as { created: boolean };
  return { created: Boolean(data.created) };
}

export async function fetchNotificationChannels(): Promise<{ channels: NotificationChannel[]; warning?: string }> {
  if (!API_BASE_URL) {
    return { channels: [], warning: "Set GRANT_SENTINEL_API_URL to your Worker API endpoint." };
  }
  const response = await fetch(new URL("/api/admin/notifications", API_BASE_URL), {
    cache: "no-store",
    headers: { ...getAuthHeaders(), ...getCorrelationHeaders() }
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    return { channels: [], warning: `API error ${response.status}: ${errorText || "Unknown error"}` };
  }
  const payload = (await response.json()) as { channels: NotificationChannel[] };
  return { channels: payload.channels ?? [] };
}

export async function createNotificationChannel(payload: {
  name: string;
  type: NotificationChannel["type"];
  config: Record<string, unknown>;
  severityThreshold: NotificationChannel["severityThreshold"];
  active?: boolean;
}): Promise<{ channel?: NotificationChannel; warning?: string }> {
  if (!API_BASE_URL) {
    return { warning: "Set GRANT_SENTINEL_API_URL to your Worker API endpoint." };
  }
  const response = await fetch(new URL("/api/admin/notifications", API_BASE_URL), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...getCorrelationHeaders()
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    return { warning: `API error ${response.status}: ${errorText || "Unknown error"}` };
  }
  const data = (await response.json()) as { channel: NotificationChannel };
  return { channel: data.channel };
}

export async function updateNotificationChannel(payload: {
  id: string;
  name?: string;
  type?: NotificationChannel["type"];
  config?: Record<string, unknown>;
  severityThreshold?: NotificationChannel["severityThreshold"];
  active?: boolean;
}): Promise<{ updated: boolean; warning?: string }> {
  if (!API_BASE_URL) {
    return { updated: false, warning: "Set GRANT_SENTINEL_API_URL to your Worker API endpoint." };
  }
  const response = await fetch(new URL("/api/admin/notifications", API_BASE_URL), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...getCorrelationHeaders()
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    return { updated: false, warning: `API error ${response.status}: ${errorText || "Unknown error"}` };
  }
  const data = (await response.json()) as { updated: boolean };
  return { updated: Boolean(data.updated) };
}

export async function deleteNotificationChannel(id: string): Promise<{ deleted: boolean; warning?: string }> {
  if (!API_BASE_URL) {
    return { deleted: false, warning: "Set GRANT_SENTINEL_API_URL to your Worker API endpoint." };
  }
  const response = await fetch(new URL(`/api/admin/notifications/${id}`, API_BASE_URL), {
    method: "DELETE",
    headers: { ...getAuthHeaders(), ...getCorrelationHeaders() }
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    return { deleted: false, warning: `API error ${response.status}: ${errorText || "Unknown error"}` };
  }
  const data = (await response.json()) as { deleted: boolean };
  return { deleted: Boolean(data.deleted) };
}

export async function fetchSearchBoosts(): Promise<{ boosts: SearchBoost[]; warning?: string }> {
  if (!API_BASE_URL) {
    return { boosts: [], warning: "Set GRANT_SENTINEL_API_URL to your Worker API endpoint." };
  }
  const response = await fetch(new URL("/api/admin/search-boosts", API_BASE_URL), {
    cache: "no-store",
    headers: { ...getAuthHeaders(), ...getCorrelationHeaders() }
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    return { boosts: [], warning: `API error ${response.status}: ${errorText || "Unknown error"}` };
  }
  const payload = (await response.json()) as { boosts: SearchBoost[] };
  return { boosts: payload.boosts ?? [] };
}

export async function upsertSearchBoost(payload: { entityType: SearchBoost["entityType"]; entityValue: string; boost: number }): Promise<{ boost?: SearchBoost; warning?: string }> {
  if (!API_BASE_URL) {
    return { warning: "Set GRANT_SENTINEL_API_URL to your Worker API endpoint." };
  }
  const response = await fetch(new URL("/api/admin/search-boosts", API_BASE_URL), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...getCorrelationHeaders()
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    return { warning: `API error ${response.status}: ${errorText || "Unknown error"}` };
  }
  const data = (await response.json()) as { boost: SearchBoost };
  return { boost: data.boost };
}

export async function deleteSearchBoost(id: string): Promise<{ deleted: boolean; warning?: string }> {
  if (!API_BASE_URL) {
    return { deleted: false, warning: "Set GRANT_SENTINEL_API_URL to your Worker API endpoint." };
  }
  const response = await fetch(new URL(`/api/admin/search-boosts/${id}`, API_BASE_URL), {
    method: "DELETE",
    headers: { ...getAuthHeaders(), ...getCorrelationHeaders() }
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    return { deleted: false, warning: `API error ${response.status}: ${errorText || "Unknown error"}` };
  }
  const data = (await response.json()) as { deleted: boolean };
  return { deleted: Boolean(data.deleted) };
}

export async function fetchDiagnostics(): Promise<{ diagnostics: NormalizationDiagnosticsSummary[]; warning?: string }> {
  if (!API_BASE_URL) {
    return { diagnostics: [], warning: "Set GRANT_SENTINEL_API_URL to your Worker API endpoint." };
  }
  const response = await fetch(new URL("/api/admin/diagnostics", API_BASE_URL), {
    cache: "no-store",
    headers: { ...getAuthHeaders(), ...getCorrelationHeaders() }
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    return { diagnostics: [], warning: `API error ${response.status}: ${errorText || "Unknown error"}` };
  }
  const payload = (await response.json()) as { diagnostics: NormalizationDiagnosticsSummary[] };
  return { diagnostics: payload.diagnostics ?? [] };
}

export async function fetchFailedJobs(): Promise<{ failed: Array<{ id: string; jobType: string; error: string | null; attempts: number; failedAt: string }>; warning?: string }> {
  if (!API_BASE_URL) {
    return { failed: [], warning: "Set GRANT_SENTINEL_API_URL to your Worker API endpoint." };
  }
  const response = await fetch(new URL("/api/admin/failed-jobs", API_BASE_URL), {
    cache: "no-store",
    headers: { ...getAuthHeaders(), ...getCorrelationHeaders() }
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    return { failed: [], warning: `API error ${response.status}: ${errorText || "Unknown error"}` };
  }
  const payload = (await response.json()) as { failed: Array<{ id: string; jobType: string; error: string | null; attempts: number; failedAt: string }> };
  return { failed: payload.failed ?? [] };
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
      ...getAuthHeaders(),
      ...getCorrelationHeaders()
    },
    body: JSON.stringify(payload)
  });
  return response.ok;
}

export async function updateFundingSource(
  id: string,
  payload: {
    autoUrl?: string | null;
    integrationType?: FundingSource["integrationType"];
    active?: boolean;
    maxNotices?: number | null;
    keywordIncludes?: string | null;
    keywordExcludes?: string | null;
    language?: string | null;
    metadata?: Record<string, unknown> | null;
  }
): Promise<boolean> {
  if (!API_BASE_URL) return false;
  const response = await fetch(new URL(`/api/admin/sources/${id}`, API_BASE_URL), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...getCorrelationHeaders()
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
      ...getAuthHeaders(),
      ...getCorrelationHeaders()
    },
    body: JSON.stringify({ ruleType, value })
  });
  return response.ok;
}

export async function disableExclusionRule(id: string): Promise<boolean> {
  if (!API_BASE_URL) return false;
  const response = await fetch(new URL(`/api/admin/exclusions/${id}`, API_BASE_URL), {
    method: "DELETE",
    headers: { ...getAuthHeaders(), ...getCorrelationHeaders() }
  });
  return response.ok;
}

export async function triggerIngestionSync(): Promise<boolean> {
  if (!API_BASE_URL) return false;
  const response = await fetch(new URL("/api/admin/run-sync", API_BASE_URL), {
    method: "POST",
    headers: { ...getAuthHeaders(), ...getCorrelationHeaders() }
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
        ...authHeaders,
        ...getCorrelationHeaders()
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

