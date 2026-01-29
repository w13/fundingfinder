export const INTEGRATION_TYPE_OPTIONS = [
  { value: "manual_url", label: "Manual URL" },
  { value: "bulk_xml_zip", label: "Bulk XML ZIP" },
  { value: "bulk_xml", label: "Bulk XML" },
  { value: "bulk_json", label: "Bulk JSON" },
  { value: "bulk_csv", label: "Bulk CSV" },
  { value: "ted_xml_zip", label: "TED XML ZIP" },
  { value: "core_api", label: "Core API" }
] as const;

// Get API URL - works in both server and client contexts
// In Cloudflare Workers with OpenNext, env vars from wrangler.jsonc are available via process.env
export function getApiBaseUrl(): string {
  // Default API URL (can be overridden by environment variables)
  const DEFAULT_API_URL = "https://grant-sentinel.wakas.workers.dev";

  // Try to get from environment variables
  if (typeof process !== "undefined" && process.env) {
    const envUrl = process.env.GRANT_SENTINEL_API_URL ?? process.env.NEXT_PUBLIC_GRANT_SENTINEL_API_URL;
    if (envUrl) return envUrl;
  }

  // Fallback to default
  return DEFAULT_API_URL;
}

/**
 * Get authorization headers for server-side API calls.
 * WARNING: Only use this in server components or API routes - never in client-side code.
 * The API key should be set via ADMIN_API_KEY or GRANT_SENTINEL_ADMIN_KEY environment variable.
 */
export function getAuthHeaders(): HeadersInit {
  // Only allow in server context - check for window to detect browser
  if (typeof window !== "undefined") {
    console.error("getAuthHeaders() called in client context - API keys must not be exposed to browser");
    return {};
  }

  // Try to get API key from multiple sources
  let key: string | undefined;

  // 1. Try process.env (populated by OpenNext from Cloudflare env)
  if (typeof process !== "undefined" && process.env) {
    key = process.env.ADMIN_API_KEY ?? process.env.GRANT_SENTINEL_ADMIN_KEY;
    if (key) {
      console.log("getAuthHeaders: Found API key in process.env, length:", key.length);
      return { Authorization: `Bearer ${key}` };
    }
  }

  // 2. Try to access Cloudflare context directly (for server actions)
  try {
    // @ts-expect-error - Cloudflare context symbol
    const cloudflareContext = globalThis[Symbol.for("__cloudflare-context__")];
    if (cloudflareContext?.env) {
      key = cloudflareContext.env.ADMIN_API_KEY ?? cloudflareContext.env.GRANT_SENTINEL_ADMIN_KEY;
      if (key && typeof key === "string") {
        console.log("[getAuthHeaders] Found API key in Cloudflare context, length:", key.length);
        return { Authorization: `Bearer ${key}` };
      } else if (cloudflareContext.env.ADMIN_API_KEY !== undefined) {
        console.warn("[getAuthHeaders] ADMIN_API_KEY exists in env but is not a string:", typeof cloudflareContext.env.ADMIN_API_KEY);
      }
    } else if (cloudflareContext) {
      console.warn("[getAuthHeaders] Cloudflare context exists but env is missing");
    }
  } catch (e) {
    console.warn("[getAuthHeaders] Failed to access Cloudflare context:", e instanceof Error ? e.message : String(e));
  }

  // No key found - log detailed diagnostics
  console.warn("[getAuthHeaders] No API key found after checking all sources");

  if (typeof process !== "undefined" && process.env) {
    const allKeys = Object.keys(process.env);
    const relevantKeys = allKeys.filter((k) => k.includes("API") || k.includes("KEY") || k.includes("ADMIN"));
    console.warn("[getAuthHeaders] process.env keys (relevant):", relevantKeys.join(", ") || "none");
    console.warn("[getAuthHeaders] process.env keys (all, first 20):", allKeys.slice(0, 20).join(", "));
  } else {
    console.warn("[getAuthHeaders] process.env not available");
  }

  // Try one more time - check if the secret was set but not populated
  try {
    // @ts-expect-error
    const ctx = globalThis[Symbol.for("__cloudflare-context__")];
    if (ctx) {
      console.warn("[getAuthHeaders] Cloudflare context exists:", {
        hasEnv: !!ctx.env,
        envKeys: ctx.env ? Object.keys(ctx.env).filter((k) => k.includes("API") || k.includes("KEY")).join(", ") : "none"
      });
    }
  } catch (e) {
    // Ignore
  }

  return {};
}

