import type { SourceHealthSummary, SourceSyncRun } from "../types";

export async function insertSourceSyncRun(
  db: D1Database,
  payload: Omit<SourceSyncRun, "id" | "completedAt" | "ingestedCount" | "error">
): Promise<string> {
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO source_sync_runs (
        id, source_id, status, started_at, correlation_id, ingested_count, error
      ) VALUES (?, ?, ?, ?, ?, 0, NULL)`
    )
    .bind(id, payload.sourceId, payload.status, payload.startedAt, payload.correlationId ?? null)
    .run();
  return id;
}

export async function completeSourceSyncRun(
  db: D1Database,
  id: string,
  payload: { status: "success" | "failed"; ingestedCount: number; error?: string | null }
): Promise<void> {
  await db
    .prepare(
      `UPDATE source_sync_runs
       SET status = ?, completed_at = ?, ingested_count = ?, error = ?
       WHERE id = ?`
    )
    .bind(payload.status, new Date().toISOString(), payload.ingestedCount, payload.error ?? null, id)
    .run();
}

export async function getSourceHealthSummary(db: D1Database): Promise<SourceHealthSummary[]> {
  const metrics = await db
    .prepare(
      `SELECT
        source_id as sourceId,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failedRuns,
        COUNT(*) as totalRuns,
        MAX(CASE WHEN status = 'success' THEN completed_at END) as lastSuccess,
        MAX(CASE WHEN status = 'failed' THEN error END) as lastError
      FROM source_sync_runs
      WHERE started_at >= datetime('now', '-30 days')
      GROUP BY source_id`
    )
    .all<{
      sourceId: string;
      failedRuns: number | null;
      totalRuns: number | null;
      lastSuccess: string | null;
      lastError: string | null;
    }>();

  const ingested = await db
    .prepare(
      `SELECT
        source_id as sourceId,
        SUM(ingested_count) as ingestedLast24h
      FROM source_sync_runs
      WHERE completed_at >= datetime('now', '-1 day') AND status = 'success'
      GROUP BY source_id`
    )
    .all<{ sourceId: string; ingestedLast24h: number | null }>();

  const ingestedMap = new Map((ingested.results ?? []).map((row) => [row.sourceId, row.ingestedLast24h ?? 0]));

  return (metrics.results ?? []).map((row) => {
    const total = Number(row.totalRuns ?? 0);
    const failed = Number(row.failedRuns ?? 0);
    const errorRate = total > 0 ? failed / total : 0;
    return {
      sourceId: row.sourceId,
      lastSuccessfulSync: row.lastSuccess,
      errorRate,
      ingestedLast24h: Number(ingestedMap.get(row.sourceId) ?? 0),
      recentFailures: failed,
      lastError: row.lastError
    };
  });
}
