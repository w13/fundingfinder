export const INTEGRATION_TYPE_OPTIONS = [
  { value: "manual_url", label: "Manual URL" },
  { value: "bulk_xml_zip", label: "Bulk XML ZIP" },
  { value: "bulk_xml", label: "Bulk XML" },
  { value: "bulk_json", label: "Bulk JSON" },
  { value: "ted_xml_zip", label: "TED XML ZIP" },
  { value: "core_api", label: "Core API" }
] as const;

// Get API URL - works in both server and client contexts
// In Cloudflare Workers with OpenNext, env vars from wrangler.jsonc are available via process.env
export function getApiBaseUrl(): string {
  // Default API URL (can be overridden by environment variables)
  const DEFAULT_API_URL = 'https://grant-sentinel.wakas.workers.dev';
  
  // Try to get from environment variables
  if (typeof process !== 'undefined' && process.env) {
    const envUrl = process.env.GRANT_SENTINEL_API_URL ?? 
                   process.env.NEXT_PUBLIC_GRANT_SENTINEL_API_URL;
    if (envUrl) return envUrl;
  }
  
  // Fallback to default
  return DEFAULT_API_URL;
}
