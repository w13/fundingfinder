import type { Env } from "../types";

export async function resolvePdfLinks(
  env: Env,
  detailUrl: string | null,
  documentUrls: string[]
): Promise<string[]> {
  const urls = new Set(documentUrls.filter(Boolean));
  if (urls.size > 0) {
    return Array.from(urls);
  }

  if (!detailUrl) return [];

  const response = env.BROWSER ? await env.BROWSER.fetch(detailUrl) : await fetch(detailUrl);
  if (!response.ok) return [];

  const html = await response.text();
  const matches = Array.from(html.matchAll(/href=["']([^"']+\.pdf[^"']*)["']/gi));
  for (const match of matches) {
    const href = match[1];
    if (!href) continue;
    const resolved = href.startsWith("http") ? href : new URL(href, detailUrl).toString();
    urls.add(resolved);
  }

  return Array.from(urls);
}
