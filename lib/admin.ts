import type { AdminSummary, ExclusionRule } from "./types";

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
