import { pause } from "../utils";
import type { Env } from "../types";

export async function politeFetch(
  request: RequestInfo | URL,
  init: RequestInit = {},
  env: Env,
  ctx: ExecutionContext,
  retries = 3
): Promise<Response> {
  const delay = Math.max(100, Number(env.POLITE_DELAY_MS ?? 400));
  const urlStr = typeof request === "string" ? request : "href" in request ? request.href : request.toString();
  const host = new URL(urlStr).host;

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      // Initial polite delay (increases slightly on retries implicitly by execution time, but let's be explicit)
      await pause(delay);

      const response = await fetch(request, init);

      if (response.ok || response.status === 404) {
        ctx.waitUntil(reportPoliteDelay(delay, host));
        return response;
      }

      // Retry on Server Errors (5xx) or Rate Limits (429)
      if (response.status >= 500 || response.status === 429) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Return client errors (400-403, etc.) immediately without retry
      return response;
    } catch (error) {
      lastError = error;
      attempt += 1;
      if (attempt > retries) break;

      console.warn(`Fetch failed for ${urlStr} (attempt ${attempt}/${retries}): ${lastError}`);
      // Exponential backoff: 1s, 2s, 4s...
      await pause(1000 * Math.pow(2, attempt - 1));
    }
  }

  throw lastError ?? new Error(`Failed to fetch ${urlStr} after ${retries} retries`);
}

async function reportPoliteDelay(delay: number, host: string): Promise<void> {
  await Promise.resolve({ delay, host });
}
