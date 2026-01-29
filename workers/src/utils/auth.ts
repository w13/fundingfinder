import type { Env } from "../types";

/**
 * Authorize a request using the ADMIN_API_KEY.
 * If ADMIN_API_KEY is not set, all requests are allowed (open access).
 * If ADMIN_API_KEY is set, requests must include matching Bearer token.
 */
export function authorize(request: Request, env: Env): boolean {
  // If no API key configured, allow all requests (original design per README)
  if (!env.ADMIN_API_KEY) {
    return true;
  }

  const auth = request.headers.get("Authorization");
  if (!auth) return false;

  // Constant-time comparison to prevent timing attacks
  const expected = `Bearer ${env.ADMIN_API_KEY}`;
  if (auth.length !== expected.length) return false;

  let result = 0;
  for (let i = 0; i < auth.length; i++) {
    result |= auth.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return result === 0;
}
