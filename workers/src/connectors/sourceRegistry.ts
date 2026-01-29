import type { Env, ExclusionRule, FundingSource, OpportunityRecord } from "../types";
import { syncGrantsGov } from "./grantsGov";
import { syncSamGov } from "./samGov";
import { syncHrsa } from "./hrsa";
import { syncTedEu } from "./tedEu";
import { isBulkType, syncBulkSource } from "./bulkImport";
import { syncScraperSource } from "./scraper";
import { getSourceDefinition } from "../sources/registry";

export interface SourceSyncOptions {
  url?: string;
  maxNotices?: number;
}

export async function syncFundingSource(
  env: Env,
  ctx: ExecutionContext,
  source: FundingSource,
  rules: ExclusionRule[],
  options: SourceSyncOptions
): Promise<OpportunityRecord[]> {
  if (source.integrationType === "core_api") {
    if (source.id === "grants_gov") {
      return (await syncGrantsGov(env, ctx, rules)).records;
    }
    if (source.id === "sam_gov") {
      return (await syncSamGov(env, ctx, rules)).records;
    }
    if (source.id === "hrsa") {
      return (await syncHrsa(env, ctx, rules)).records;
    }
    return [];
  }

  if (source.integrationType === "ted_xml_zip") {
    const { records } = await syncTedEu(env, ctx, rules, {
      zipUrl: options.url ?? source.autoUrl ?? undefined,
      maxNotices: options.maxNotices
    });
    return records;
  }

  const def = getSourceDefinition(source.id);

  // New: Selector-based Scraping Engine
  if (source.integrationType === "manual_url" && def?.scraping) {
    return syncScraperSource(env, ctx, source, rules, { url: options.url }, def.scraping);
  }

  if (isBulkType(source.integrationType)) {
    if (!options.url && !source.autoUrl && source.integrationType === "manual_url") {
      throw new Error("Manual source requires a download URL.");
    }
    const parsingProfile = def?.parsing;
    return syncBulkSource(env, ctx, source, rules, options, parsingProfile);
  }

  return [];
}
