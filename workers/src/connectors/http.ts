import { pause } from "../utils";
import type { Env } from "../types";

export async function politeFetch(
  request: RequestInfo | URL,
  init: RequestInit,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  const delay = Math.max(100, Number(env.POLITE_DELAY_MS ?? 400));
  await pause(delay);
  const response = await fetch(request, init);
  ctx.waitUntil(reportPoliteDelay(delay, new URL(request.toString()).host));
  return response;
}

async function reportPoliteDelay(delay: number, host: string): Promise<void> {
  await Promise.resolve({ delay, host });
}
