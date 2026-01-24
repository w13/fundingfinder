"use server";

import { syncFundingSource, updateFundingSource, triggerIngestionSync, createExclusionRule, disableExclusionRule } from "../../lib/admin";
import { revalidatePath } from "next/cache";

export async function handleSync(formData: FormData) {
  const sourceId = String(formData.get("sourceId") ?? "").trim();
  if (!sourceId) return;
  await syncFundingSource(sourceId, {});
  revalidatePath("/sources");
}

export async function handleToggle(formData: FormData) {
  const sourceId = String(formData.get("sourceId") ?? "").trim();
  const active = String(formData.get("active") ?? "") === "true";
  if (!sourceId) return;
  await updateFundingSource(sourceId, { active });
  revalidatePath("/sources");
}

export async function handleSyncAll() {
  await triggerIngestionSync();
  revalidatePath("/sources");
}

export async function handleSourceSync(formData: FormData) {
  const sourceId = String(formData.get("sourceId") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const maxNotices = Number(formData.get("maxNotices") ?? "");
  if (!sourceId) return;
  await syncFundingSource(sourceId, {
    url: url || undefined,
    maxNotices: Number.isNaN(maxNotices) ? undefined : maxNotices
  });
  revalidatePath("/sources");
}

export async function handleSourceUpdate(formData: FormData) {
  const sourceId = String(formData.get("sourceId") ?? "").trim();
  const autoUrl = String(formData.get("autoUrl") ?? "").trim();
  const integrationType = String(formData.get("integrationType") ?? "").trim();
  const active = formData.get("active") === "on";
  if (!sourceId) return;
  await updateFundingSource(sourceId, {
    integrationType: integrationType as "core_api" | "ted_xml_zip" | "bulk_xml_zip" | "bulk_xml" | "bulk_json" | "manual_url",
    autoUrl: autoUrl ? autoUrl : null,
    active
  });
  revalidatePath("/sources");
}

export async function handleRowSync(formData: FormData) {
  const sourceId = String(formData.get("sourceId") ?? "").trim();
  const maxNotices = Number(formData.get("maxNotices") ?? "");
  if (!sourceId) return;
  await syncFundingSource(sourceId, {
    maxNotices: Number.isNaN(maxNotices) ? undefined : maxNotices
  });
  revalidatePath("/sources");
}

export async function handleAddRule(formData: FormData) {
  const ruleType = String(formData.get("ruleType") ?? "");
  const value = String(formData.get("value") ?? "").trim();
  if (!ruleType || !value) return;
  await createExclusionRule(ruleType as "excluded_bureau" | "priority_agency", value);
  revalidatePath("/sources");
}

export async function handleDisableRule(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await disableExclusionRule(id);
  revalidatePath("/sources");
}
