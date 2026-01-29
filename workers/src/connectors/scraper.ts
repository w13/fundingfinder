import * as cheerio from "cheerio";
import type { Env, ExclusionRule, FundingSource, OpportunityRecord } from "../types";
import { agencyPriorityBoost, buildAgencyFilters, isAgencyExcluded, scoreKeywords } from "../filters";
import { hashText, normalizeDate, normalizeText, pause } from "../utils";
import { politeFetch } from "./http";
import type { ScrapingProfile, Selector } from "../sources/types";

export interface ScraperOptions {
  url?: string;
  maxPages?: number;
}

export async function syncScraperSource(
  env: Env,
  ctx: ExecutionContext,
  source: FundingSource,
  rules: ExclusionRule[],
  options: ScraperOptions,
  profile: ScrapingProfile
): Promise<OpportunityRecord[]> {
  const records: any[] = []; // Intermediate storage
  const filters = buildAgencyFilters(env.EXCLUDED_BUREAUS, env.PRIORITY_AGENCIES, rules);
  let currentUrl = options.url ?? source.autoUrl;
  let pages = 0;
  const maxPages = options.maxPages ?? 5;

  while (currentUrl && pages < maxPages) {
    try {
      const response = await politeFetch(currentUrl, { method: "GET" }, env, ctx);
      if (!response.ok) {
        const msg = `Scraper failed for ${source.id}: ${response.status} ${response.statusText}`;
        if (pages === 0) {
          throw new Error(msg);
        }
        console.warn(msg);
        break;
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const items = $(profile.itemSelector);

      if (items.length === 0) {
        const msg = `No items found for ${source.id} with selector ${profile.itemSelector}`;
        if (pages === 0) {
           console.warn(msg); // Warn but don't throw if just empty? Maybe site changed.
           // If selector is wrong, it's a "failure" of the scraper configuration.
           // But empty results happen.
        }
        console.warn(msg);
        break;
      }

      items.each((_, el) => {
        const $el = $(el) as any; // Cast to bypass strict check for now inside loop
        // Re-wrap with cheerio
        const $item = $($el);

        const title = extract($item, profile.fields.title);
        // Pass currentUrl as base for relative links
        const url = extract($item, profile.fields.url, currentUrl); 
        
        if (!title || !url) return;

        const idRaw = profile.fields.id ? extract($item, profile.fields.id) : null;
        const summary = profile.fields.summary ? extract($item, profile.fields.summary) : null;
        const agency = profile.fields.agency ? extract($item, profile.fields.agency) : null;
        const postedDate = profile.fields.postedDate ? extract($item, profile.fields.postedDate) : null;
        const dueDate = profile.fields.dueDate ? extract($item, profile.fields.dueDate) : null;
        const status = profile.fields.status ? extract($item, profile.fields.status) : null;

        const combined = normalizeText(`${title} ${summary ?? ""} ${agency ?? ""}`);
        
        records.push({
          title, url, idRaw, summary, agency, postedDate, dueDate, status, combined
        });
      });

      // Pagination
      if (profile.nextPageSelector) {
        const nextLink = $(profile.nextPageSelector);
        const nextHref = nextLink.attr("href");
        if (nextHref) {
          currentUrl = new URL(nextHref, currentUrl).toString();
          pages++;
          await pause(2000); // Polite delay between pages
        } else {
          currentUrl = null;
        }
      } else {
        currentUrl = null;
      }
    } catch (error) {
      if (pages === 0) throw error;
      console.error(`Scraper error for ${source.id}:`, error);
      break;
    }
  }

  // Post-process (async operations)
  const finalRecords: OpportunityRecord[] = [];
  for (const raw of records) {
    if (isAgencyExcluded(raw.agency, filters)) continue;
    
    // Simple keyword score check (can be improved)
    // For bespoke scrapers, we assume if we scraped it, it's somewhat relevant, 
    // but filtering removes noise.
    // If no keywords matched, score is 0. 
    // We might want to keep everything from a targeted scrape? 
    // Existing logic drops score <= 0. Let's stick to it.
    const keywordScore = scoreKeywords(raw.combined) + agencyPriorityBoost(raw.agency, filters);
    // Force keep if it's a manual source? No, consistency is key.
    
    // Actually, ensure we default score to 1 if we scraped it specifically?
    // Let's rely on standard logic for now.

    const opportunityId = raw.idRaw 
      ? normalizeText(raw.idRaw) 
      : `SCR-${(await hashText(raw.url)).slice(0, 12)}`;

    finalRecords.push({
      id: crypto.randomUUID(),
      opportunityId,
      source: source.id,
      title: normalizeText(raw.title),
      agency: raw.agency ? normalizeText(raw.agency) : null,
      bureau: null,
      status: raw.status ? normalizeText(raw.status) : null,
      summary: raw.summary ? normalizeText(raw.summary) : null,
      eligibility: "Check website",
      forProfitEligible: true, // Optimistic default
      smallBusinessEligible: false,
      keywordScore,
      postedDate: normalizeDate(raw.postedDate),
      dueDate: normalizeDate(raw.dueDate),
      url: normalizeText(raw.url),
      version: 1,
      versionHash: await hashText(JSON.stringify(raw)),
      rawPayload: raw
    });
  }

  return finalRecords;
}

function extract($el: any, selector: Selector, baseUrl?: string | null): string | null {
  const selectors = Array.isArray(selector.selector) ? selector.selector : [selector.selector];
  
  let value = "";
  for (const sel of selectors) {
    const target = sel === "." ? $el : $el.find(sel);
    if (selector.attr) {
      value = target.attr(selector.attr) ?? "";
    } else {
      value = target.text();
    }
    if (value && value.trim().length > 0) break;
  }
  
  if (selector.regex) {
    const match = value.match(new RegExp(selector.regex));
    if (match && match[1]) value = match[1];
  }

  value = normalizeText(value);
  if (!value) return null;

  if (baseUrl && selector.attr === "href" && !value.startsWith("http")) {
    try {
      return new URL(value, baseUrl).toString();
    } catch { return value; }
  }

  return value;
}
