import type { SearchAnalyticsSummary, SearchClickEvent } from "../types";

export async function insertSearchClickEvent(
  db: D1Database,
  event: Omit<SearchClickEvent, "id" | "createdAt">
): Promise<SearchClickEvent> {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO search_click_events (
        id, query, source_filter, min_score, mode, opportunity_id, source, result_id, position, correlation_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      event.query ?? null,
      event.sourceFilter ?? null,
      event.minScore ?? null,
      event.mode ?? null,
      event.opportunityId,
      event.source,
      event.resultId ?? null,
      event.position ?? null,
      event.correlationId ?? null,
      createdAt
    )
    .run();

  return {
    ...event,
    id,
    createdAt
  };
}

export async function getSearchAnalyticsSummary(db: D1Database): Promise<SearchAnalyticsSummary> {
  const topQueries = await db
    .prepare(
      `SELECT query, COUNT(*) as clicks
       FROM search_click_events
       WHERE query IS NOT NULL AND query != ''
       GROUP BY query
       ORDER BY clicks DESC
       LIMIT 10`
    )
    .all<{ query: string; clicks: number }>();

  const topSources = await db
    .prepare(
      `SELECT source, COUNT(*) as clicks
       FROM search_click_events
       GROUP BY source
       ORDER BY clicks DESC
       LIMIT 10`
    )
    .all<{ source: string; clicks: number }>();

  const recentClicks = await db
    .prepare(
      `SELECT query, source, opportunity_id as opportunityId, created_at as createdAt, position
       FROM search_click_events
       ORDER BY created_at DESC
       LIMIT 20`
    )
    .all<{ query: string | null; source: string; opportunityId: string; createdAt: string; position: number | null }>();

  return {
    topQueries: topQueries.results ?? [],
    topSources: topSources.results ?? [],
    recentClicks: recentClicks.results ?? []
  };
}
