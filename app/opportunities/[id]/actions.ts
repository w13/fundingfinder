"use server";

import { revalidatePath } from "next/cache";
import { addShortlist } from "../../../lib/api/shortlist";

export async function handleShortlist(formData: FormData) {
  const opportunityId = String(formData.get("opportunityId") ?? "").trim();
  const source = String(formData.get("source") ?? "").trim();
  const pageId = String(formData.get("pageId") ?? "").trim();
  
  if (!opportunityId || !source) return;
  
  await addShortlist(opportunityId, source);
  if (pageId) {
    revalidatePath(`/opportunities/${pageId}`);
  }
  revalidatePath("/shortlist");
}
