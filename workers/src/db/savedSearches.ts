import type { SavedSearch } from "../types";

export async function listSavedSearches(db: D1Database): Promise<SavedSearch[]> {
  const results = await db
    .prepare(
      `SELECT
        id,
        name,
        query,
        source,
        min_score as minScore,
        mode,
        created_at as createdAt
      FROM saved_searches
      ORDER BY created_at DESC`
    )
    .all<{
      id: string;
      name: string;
      query: string | null;
      source: string | null;
      minScore: number | null;
      mode: "smart" | "exact" | "any" | null;
      createdAt: string;
    }>();

  return results.results ?? [];
}

export async function insertSavedSearch(
  db: D1Database,
  payload: {
    name: string;
    query?: string | null;
    source?: string | null;
    minScore?: number | null;
    mode?: "smart" | "exact" | "any" | null;
  }
): Promise<SavedSearch> {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO saved_searches (
        id, name, query, source, min_score, mode, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      payload.name,
      payload.query ?? null,
      payload.source ?? null,
      payload.minScore ?? null,
      payload.mode ?? null,
      createdAt
    )
    .run();

  return {
    id,
    name: payload.name,
    query: payload.query ?? null,
    source: payload.source ?? null,
    minScore: payload.minScore ?? null,
    mode: payload.mode ?? null,
    createdAt
  };
}

export async function deleteSavedSearch(db: D1Database, id: string): Promise<boolean> {
  const result = await db.prepare("DELETE FROM saved_searches WHERE id = ?").bind(id).run();
  return Boolean(result.meta?.changes);
}
