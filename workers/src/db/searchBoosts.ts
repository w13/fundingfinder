import type { SearchBoost } from "../types";

export async function listSearchBoosts(db: D1Database): Promise<SearchBoost[]> {
  const results = await db
    .prepare(
      `SELECT
        id,
        entity_type as entityType,
        entity_value as entityValue,
        boost,
        updated_at as updatedAt
      FROM search_boosts
      ORDER BY updated_at DESC`
    )
    .all<{ id: string; entityType: "source" | "agency"; entityValue: string; boost: number; updatedAt: string }>();

  return results.results ?? [];
}

export async function upsertSearchBoost(
  db: D1Database,
  payload: Omit<SearchBoost, "id" | "updatedAt">
): Promise<SearchBoost> {
  const id = crypto.randomUUID();
  const updatedAt = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO search_boosts (id, entity_type, entity_value, boost, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(entity_type, entity_value)
       DO UPDATE SET boost = excluded.boost, updated_at = excluded.updated_at`
    )
    .bind(id, payload.entityType, payload.entityValue, payload.boost, updatedAt)
    .run();

  const result = await db
    .prepare(
      `SELECT id, entity_type as entityType, entity_value as entityValue, boost, updated_at as updatedAt
       FROM search_boosts
       WHERE entity_type = ? AND entity_value = ?`
    )
    .bind(payload.entityType, payload.entityValue)
    .first<{ id: string; entityType: "source" | "agency"; entityValue: string; boost: number; updatedAt: string }>();

  if (!result) {
    return {
      id,
      entityType: payload.entityType,
      entityValue: payload.entityValue,
      boost: payload.boost,
      updatedAt
    };
  }

  return result;
}

export async function deleteSearchBoost(db: D1Database, id: string): Promise<boolean> {
  const result = await db.prepare("DELETE FROM search_boosts WHERE id = ?").bind(id).run();
  return Boolean(result.meta?.changes);
}
