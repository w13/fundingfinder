import type { AdminSummary, ExclusionRule, FundingSource } from "./types";

const API_BASE_URL =
  process.env.GRANT_SENTINEL_API_URL ?? process.env.NEXT_PUBLIC_GRANT_SENTINEL_API_URL ?? "";

export async function fetchAdminSummary(): Promise<{ summary: AdminSummary | null; warning?: string }> {
  if (!API_BASE_URL) {
    return { summary: null, warning: "Set GRANT_SENTINEL_API_URL to your Worker API endpoint." };
  }
  const response = await fetch(new URL("/api/admin/summary", API_BASE_URL), { cache: "no-store" });
  if (!response.ok) {
    return { summary: null, warning: `API error ${response.status}` };
  }
  const payload = (await response.json()) as { summary: AdminSummary };
  return { summary: payload.summary };
}

export async function fetchExclusionRules(): Promise<{ rules: ExclusionRule[]; warning?: string }> {
  if (!API_BASE_URL) {
    return { rules: [], warning: "Set GRANT_SENTINEL_API_URL to your Worker API endpoint." };
  }
  const response = await fetch(new URL("/api/admin/exclusions", API_BASE_URL), { cache: "no-store" });
  if (!response.ok) {
    return { rules: [], warning: `API error ${response.status}` };
  }
  const payload = (await response.json()) as { rules: ExclusionRule[] };
  return { rules: payload.rules ?? [] };
}

export async function fetchFundingSources(): Promise<{ sources: FundingSource[]; warning?: string }> {
  if (!API_BASE_URL) {
    return { sources: [], warning: "Set GRANT_SENTINEL_API_URL to your Worker API endpoint." };
  }
  const response = await fetch(new URL("/api/admin/sources", API_BASE_URL), { cache: "no-store" });
  if (!response.ok) {
    return { sources: [], warning: `API error ${response.status}` };
  }
  const payload = (await response.json()) as { sources: FundingSource[] };
  return { sources: payload.sources ?? [] };
}

export async function syncFundingSource(
  id: string,
  payload: { url?: string; maxNotices?: number }
): Promise<boolean> {
  if (!API_BASE_URL) return false;
  const response = await fetch(new URL(`/api/admin/sources/${id}/sync`, API_BASE_URL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return response.ok;
}

export async function createExclusionRule(ruleType: ExclusionRule["ruleType"], value: string): Promise<boolean> {
  if (!API_BASE_URL) return false;
  const response = await fetch(new URL("/api/admin/exclusions", API_BASE_URL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ruleType, value })
  });
  return response.ok;
}

export async function disableExclusionRule(id: string): Promise<boolean> {
  if (!API_BASE_URL) return false;
  const response = await fetch(new URL(`/api/admin/exclusions/${id}`, API_BASE_URL), {
    method: "DELETE"
  });
  return response.ok;
}

export async function triggerIngestionSync(): Promise<boolean> {
  if (!API_BASE_URL) return false;
  const response = await fetch(new URL("/api/admin/run-sync", API_BASE_URL), {
    method: "POST"
  });
  return response.ok;
}

