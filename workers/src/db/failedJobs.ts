import type { FailedJob } from "../types";
import { safeJsonParse } from "../utils";

export async function insertFailedJob(
  db: D1Database,
  payload: {
    jobType: string;
    jobPayload: Record<string, unknown>;
    error?: string | null;
    attempts?: number;
    correlationId?: string | null;
  }
): Promise<FailedJob> {
  const id = crypto.randomUUID();
  const failedAt = new Date().toISOString();
  const attempts = payload.attempts ?? 0;

  await db
    .prepare(
      `INSERT INTO failed_jobs (
        id, job_type, payload, error, attempts, failed_at, correlation_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      payload.jobType,
      JSON.stringify(payload.jobPayload ?? {}),
      payload.error ?? null,
      attempts,
      failedAt,
      payload.correlationId ?? null
    )
    .run();

  return {
    id,
    jobType: payload.jobType,
    payload: payload.jobPayload ?? {},
    error: payload.error ?? null,
    attempts,
    failedAt,
    correlationId: payload.correlationId ?? null
  };
}

export async function listFailedJobs(db: D1Database, limit = 50): Promise<FailedJob[]> {
  const results = await db
    .prepare(
      `SELECT id, job_type as jobType, payload, error, attempts, failed_at as failedAt, correlation_id as correlationId
       FROM failed_jobs
       ORDER BY failed_at DESC
       LIMIT ?`
    )
    .bind(limit)
    .all<{
      id: string;
      jobType: string;
      payload: string;
      error: string | null;
      attempts: number;
      failedAt: string;
      correlationId: string | null;
    }>();

  return (
    results.results?.map((row) => ({
      id: row.id,
      jobType: row.jobType,
      payload: safeJsonParse<Record<string, unknown>>(row.payload) ?? {},
      error: row.error,
      attempts: Number(row.attempts ?? 0),
      failedAt: row.failedAt,
      correlationId: row.correlationId
    })) ?? []
  );
}
