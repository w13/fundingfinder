import type { Env, SourceSystem } from "../types";
import { normalizeText } from "../utils";

const MODEL = "@cf/baai/bge-large-en-v1.5";

export async function indexOpportunity(
  env: Env,
  id: string,
  source: SourceSystem,
  text: string,
  metadata: Record<string, string | number | boolean | null>
): Promise<void> {
  const cleaned = normalizeText(text);
  if (!cleaned) return;

  const response = await env.AI.run(MODEL, { text: cleaned });
  const vector = extractVector(response);
  if (!vector) return;

  await env.VECTORIZE.upsert([
    {
      id: `${source}:${id}`,
      values: vector,
      metadata
    }
  ]);
}

function extractVector(response: unknown): number[] | null {
  if (!response) return null;
  const record = response as Record<string, unknown>;
  const data = record.data as number[][] | undefined;
  if (Array.isArray(data) && Array.isArray(data[0])) return data[0];
  const vector = record.values as number[] | undefined;
  if (Array.isArray(vector)) return vector;
  return null;
}
