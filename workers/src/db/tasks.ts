import { safeJsonParse } from "../utils";

export type TaskStatus = "pending" | "processing" | "completed" | "failed";

export interface Task {
  id: string;
  type: string;
  payload: unknown;
  status: TaskStatus;
  error: string | null;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: string | null;
  createdAt: string;
}

interface TaskRow {
  id: string;
  type: string;
  payload: string | null;
  status: string;
  error: string | null;
  attempts: number;
  max_attempts: number;
  next_attempt_at: string | null;
  created_at: string;
}

function isValidTaskStatus(status: string): status is TaskStatus {
  return ["pending", "processing", "completed", "failed"].includes(status);
}

export async function insertTask(
  db: D1Database,
  type: string,
  payload: unknown,
  options: { maxAttempts?: number; nextAttemptAt?: string | null } = {}
): Promise<string> {
  const id = crypto.randomUUID();
  await db
    .prepare(
      "INSERT INTO tasks (id, type, payload, max_attempts, next_attempt_at, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(
      id,
      type,
      JSON.stringify(payload),
      options.maxAttempts ?? 5,
      options.nextAttemptAt ?? null,
      new Date().toISOString()
    )
    .run();
  return id;
}

export async function getNextPendingTask(db: D1Database): Promise<Task | null> {
  const result = await db
    .prepare(
      `
    UPDATE tasks
    SET status = 'processing',
        started_at = ?,
        attempts = attempts + 1
    WHERE id = (
      SELECT id
      FROM tasks
      WHERE status = 'pending'
        AND (next_attempt_at IS NULL OR next_attempt_at <= datetime('now'))
      ORDER BY created_at ASC
      LIMIT 1
    )
    RETURNING *
  `
    )
    .bind(new Date().toISOString())
    .first<TaskRow>();

  if (!result) return null;

  const status = isValidTaskStatus(result.status) ? result.status : "pending";

  return {
    id: result.id,
    type: result.type,
    payload: safeJsonParse(result.payload),
    status,
    error: result.error,
    attempts: Number(result.attempts ?? 0),
    maxAttempts: Number(result.max_attempts ?? 5),
    nextAttemptAt: result.next_attempt_at,
    createdAt: result.created_at
  };
}

export async function updateTaskStatus(db: D1Database, id: string, status: string, error?: string): Promise<void> {
  await db.prepare("UPDATE tasks SET status = ?, error = ?, completed_at = ? WHERE id = ?")
    .bind(status, error ?? null, status === 'completed' || status === 'failed' ? new Date().toISOString() : null, id)
    .run();
}

export async function rescheduleTask(
  db: D1Database,
  id: string,
  nextAttemptAt: string,
  error?: string
): Promise<void> {
  await db
    .prepare("UPDATE tasks SET status = 'pending', error = ?, next_attempt_at = ? WHERE id = ?")
    .bind(error ?? null, nextAttemptAt, id)
    .run();
}
