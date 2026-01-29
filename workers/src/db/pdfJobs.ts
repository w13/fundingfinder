import type { PdfJobMetrics } from "../types";

export async function insertPdfJob(
  db: D1Database,
  payload: {
    id: string;
    opportunityId: string;
    source: string;
    status: "queued" | "processing" | "completed" | "failed";
    correlationId?: string | null;
  }
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO pdf_jobs (
        id, opportunity_id, source, status, queued_at, correlation_id
      ) VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(
      payload.id,
      payload.opportunityId,
      payload.source,
      payload.status,
      new Date().toISOString(),
      payload.correlationId ?? null
    )
    .run();
}

export async function markPdfJobProcessing(db: D1Database, id: string): Promise<void> {
  await db
    .prepare(
      `UPDATE pdf_jobs
       SET status = 'processing', started_at = ?, attempts = attempts + 1
       WHERE id = ?`
    )
    .bind(new Date().toISOString(), id)
    .run();
}

export async function markPdfJobCompleted(db: D1Database, id: string): Promise<void> {
  await db
    .prepare(
      `UPDATE pdf_jobs
       SET status = 'completed',
           completed_at = ?,
           duration_ms = CAST((julianday(?) - julianday(started_at)) * 86400000 AS INTEGER)
       WHERE id = ?`
    )
    .bind(new Date().toISOString(), new Date().toISOString(), id)
    .run();
}

export async function markPdfJobFailed(db: D1Database, id: string, error: string | null): Promise<void> {
  await db
    .prepare(
      `UPDATE pdf_jobs
       SET status = 'failed',
           completed_at = ?,
           error = ?
       WHERE id = ?`
    )
    .bind(new Date().toISOString(), error ?? null, id)
    .run();
}

export async function getPdfJobMetrics(db: D1Database): Promise<PdfJobMetrics> {
  const counts = await db
    .prepare(
      `SELECT
        SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) as queued,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'completed' AND completed_at >= datetime('now', '-1 day') THEN 1 ELSE 0 END) as completedLast24h,
        SUM(CASE WHEN status = 'failed' AND completed_at >= datetime('now', '-1 day') THEN 1 ELSE 0 END) as failedLast24h,
        AVG(CASE WHEN status = 'completed' THEN duration_ms END) as avgProcessingMs,
        MAX(CASE WHEN status = 'completed' THEN completed_at END) as lastCompletedAt,
        MAX(CASE WHEN status = 'failed' THEN error END) as lastFailureReason
      FROM pdf_jobs`
    )
    .first<{
      queued: number | null;
      processing: number | null;
      completedLast24h: number | null;
      failedLast24h: number | null;
      avgProcessingMs: number | null;
      lastCompletedAt: string | null;
      lastFailureReason: string | null;
    }>();

  return {
    queued: Number(counts?.queued ?? 0),
    processing: Number(counts?.processing ?? 0),
    completedLast24h: Number(counts?.completedLast24h ?? 0),
    failedLast24h: Number(counts?.failedLast24h ?? 0),
    avgProcessingMs: counts?.avgProcessingMs ? Number(counts.avgProcessingMs) : null,
    lastCompletedAt: counts?.lastCompletedAt ?? null,
    lastFailureReason: counts?.lastFailureReason ?? null
  };
}
