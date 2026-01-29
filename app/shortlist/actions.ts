"use server";

import { revalidatePath } from "next/cache";
import { analyzeShortlist, removeShortlist } from "../../lib/api/shortlist";

export async function handleAnalyze() {
  await analyzeShortlist();
  revalidatePath("/shortlist");
}

export async function handleRemove(formData: FormData) {
  const shortlistId = String(formData.get("shortlistId") ?? "").trim();
  if (!shortlistId) return;
  await removeShortlist(shortlistId);
  revalidatePath("/shortlist");
}
