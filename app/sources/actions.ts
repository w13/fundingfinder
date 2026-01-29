"use server";

import { syncFundingSource, updateFundingSource, triggerIngestionSync, createExclusionRule, disableExclusionRule, toggleAllSources } from "../../lib/api/admin";
import { revalidatePath } from "next/cache";
import { logServerError } from "../../lib/errors/serverErrorLogger";
import { isReadOnlyMode } from "../../lib/domain/constants";

export async function handleSync(formData: FormData) {
  if (isReadOnlyMode()) return;
  const sourceId = String(formData.get("sourceId") ?? "").trim();
  if (!sourceId) return;
  // Enable the source when manually syncing
  await updateFundingSource(sourceId, { active: true });
  await syncFundingSource(sourceId, {});
  revalidatePath("/sources");
}

export async function handleToggle(formData: FormData) {
  if (isReadOnlyMode()) return;
  const sourceId = String(formData.get("sourceId") ?? "").trim();
  const active = String(formData.get("active") ?? "") === "true";
  if (!sourceId) return;
  await updateFundingSource(sourceId, { active });
  revalidatePath("/sources");
}

export async function handleSyncAll(formData?: FormData) {
  if (isReadOnlyMode()) return;
  await triggerIngestionSync();
  revalidatePath("/sources");
}

export async function handleSourceSync(formData: FormData) {
  if (isReadOnlyMode()) return;
  const sourceId = String(formData.get("sourceId") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const maxNotices = Number(formData.get("maxNotices") ?? "");
  if (!sourceId) return;
  // Enable the source when manually syncing
  await updateFundingSource(sourceId, { active: true });
  await syncFundingSource(sourceId, {
    url: url || undefined,
    maxNotices: Number.isNaN(maxNotices) ? undefined : maxNotices
  });
  revalidatePath("/sources");
}

export async function handleSourceUpdate(formData: FormData) {
  if (isReadOnlyMode()) return;
  const sourceId = String(formData.get("sourceId") ?? "").trim();
  const autoUrl = String(formData.get("autoUrl") ?? "").trim();
  const integrationType = String(formData.get("integrationType") ?? "").trim();
  const active = formData.get("active") === "on";
  const maxNotices = Number(formData.get("maxNotices") ?? "");
  const keywordIncludes = String(formData.get("keywordIncludes") ?? "").trim();
  const keywordExcludes = String(formData.get("keywordExcludes") ?? "").trim();
  const language = String(formData.get("language") ?? "").trim();
  if (!sourceId) return;
  await updateFundingSource(sourceId, {
    integrationType: integrationType as "core_api" | "ted_xml_zip" | "bulk_xml_zip" | "bulk_xml" | "bulk_json" | "bulk_csv" | "manual_url",
    autoUrl: autoUrl ? autoUrl : null,
    active,
    maxNotices: Number.isNaN(maxNotices) ? null : maxNotices,
    keywordIncludes: keywordIncludes || null,
    keywordExcludes: keywordExcludes || null,
    language: language || null
  });
  revalidatePath("/sources");
}

export async function handleRowSync(formData: FormData) {
  if (isReadOnlyMode()) return;
  const sourceId = String(formData.get("sourceId") ?? "").trim();
  const maxNotices = Number(formData.get("maxNotices") ?? "");
  if (!sourceId) return;
  // Enable the source when manually syncing
  await updateFundingSource(sourceId, { active: true });
  await syncFundingSource(sourceId, {
    maxNotices: Number.isNaN(maxNotices) ? undefined : maxNotices
  });
  revalidatePath("/sources");
}

export async function handleAddRule(formData: FormData) {
  if (isReadOnlyMode()) return;
  const ruleType = String(formData.get("ruleType") ?? "");
  const value = String(formData.get("value") ?? "").trim();
  if (!ruleType || !value) return;
  await createExclusionRule(ruleType as "excluded_bureau" | "priority_agency", value);
  revalidatePath("/sources");
}

export async function handleDisableRule(formData: FormData) {
  if (isReadOnlyMode()) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await disableExclusionRule(id);
  revalidatePath("/sources");
}

export async function handleToggleAll(formData: FormData) {
  if (isReadOnlyMode()) return;
  const active = String(formData.get("active") ?? "") === "true";
  
  try {
    console.log(`[handleToggleAll] Starting - active=${active}`);
    
    // Log environment info for debugging
    const hasProcess = typeof process !== 'undefined';
    const hasEnv = hasProcess && typeof process.env !== 'undefined';
    const hasApiKey = hasEnv && (process.env.ADMIN_API_KEY || process.env.GRANT_SENTINEL_ADMIN_KEY);
    console.log(`[handleToggleAll] Environment - hasProcess: ${hasProcess}, hasEnv: ${hasEnv}, hasApiKey: ${!!hasApiKey}`);
    
    if (hasEnv) {
      const envKeys = Object.keys(process.env).filter(k => k.includes('API') || k.includes('KEY') || k.includes('ADMIN'));
      console.log(`[handleToggleAll] Relevant env keys: ${envKeys.join(', ') || 'none'}`);
    }
    
    const success = await toggleAllSources(active);
    
    if (!success) {
      const errorMsg = `Failed to toggle all sources to ${active} - API call returned false`;
      console.error(`[handleToggleAll] ${errorMsg}`);
      logServerError(new Error(errorMsg), {
        component: "handleToggleAll",
        action: "toggleAll",
        active,
        success: false
      });
      throw new Error(errorMsg);
    }
    
    console.log(`[handleToggleAll] Success - toggled all sources to ${active}`);
    revalidatePath("/sources");
  } catch (error) {
    const errorDetails = {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      active
    };
    
    console.error(`[handleToggleAll] Error caught:`, errorDetails);
    logServerError(error, {
      component: "handleToggleAll",
      action: "toggleAll",
      active,
      errorDetails
    });
    
    // Re-throw with a more descriptive message for production
    const userMessage = `Failed to toggle all sources: ${error instanceof Error ? error.message : String(error)}`;
    throw new Error(userMessage);
  }
}
