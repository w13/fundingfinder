import type { Env } from "./types";

export interface BriefItem {
  title: string;
  opportunityId: string;
  source: string;
  feasibilityScore: number;
  url: string | null;
}

export async function sendDailyBrief(env: Env, items: BriefItem[]): Promise<void> {
  if (!env.NOTIFICATION_WEBHOOK_URL || items.length === 0) return;

  const payload = {
    text: "Grant Sentinel Daily Brief",
    items: items.map((item) => ({
      title: item.title,
      opportunityId: item.opportunityId,
      source: item.source,
      feasibilityScore: item.feasibilityScore,
      url: item.url
    }))
  };

  await fetch(env.NOTIFICATION_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}
