"use server";

import { revalidatePath } from "next/cache";
import { analyzeShortlist, removeShortlist } from "../../lib/api/shortlist";
import { isReadOnlyMode } from "../../lib/domain/constants";

export async function handleAnalyze() {
  if (isReadOnlyMode()) return;
  await analyzeShortlist();
  revalidatePath("/shortlist");
}

export async function handleBulkAnalyze(shortlistIds: string[]) {
  if (isReadOnlyMode()) return;
  if (!Array.isArray(shortlistIds) || shortlistIds.length === 0) return;
  await analyzeShortlist(shortlistIds);
  revalidatePath("/shortlist");
}

export async function handleRemove(formData: FormData) {
  if (isReadOnlyMode()) return;
  const shortlistId = String(formData.get("shortlistId") ?? "").trim();
  if (!shortlistId) return;
  await removeShortlist(shortlistId);
  revalidatePath("/shortlist");
}
