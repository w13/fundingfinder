import { safeJsonParse } from "../utils";

export type TaskStatus = "pending" | "processing" | "completed" | "failed";

export interface Task {
  id: string;
  type: string;
  payload: unknown;
  status: TaskStatus;
  error: string | null;
  createdAt: string;
}

interface TaskRow {
  id: string;
  type: string;
  payload: string | null;
  status: string;
  error: string | null;
  created_at: string;
}

function isValidTaskStatus(status: string): status is TaskStatus {
  return ["pending", "processing", "completed", "failed"].includes(status);
}

export async function insertTask(db: D1Database, type: string, payload: unknown): Promise<string> {
  const id = crypto.randomUUID();
  await db.prepare("INSERT INTO tasks (id, type, payload, created_at) VALUES (?, ?, ?, ?)")
    .bind(id, type, JSON.stringify(payload), new Date().toISOString())
    .run();
  return id;
}

export async function getNextPendingTask(db: D1Database): Promise<Task | null> {
  const result = await db.prepare(`
    UPDATE tasks
    SET status = 'processing', started_at = ?
    WHERE id = (SELECT id FROM tasks WHERE status = 'pending' ORDER BY created_at ASC LIMIT 1)
    RETURNING *
  `).bind(new Date().toISOString()).first<TaskRow>();

  if (!result) return null;

  const status = isValidTaskStatus(result.status) ? result.status : "pending";

  return {
    id: result.id,
    type: result.type,
    payload: safeJsonParse(result.payload),
    status,
    error: result.error,
    createdAt: result.created_at
  };
}

export async function updateTaskStatus(db: D1Database, id: string, status: string, error?: string): Promise<void> {
  await db.prepare("UPDATE tasks SET status = ?, error = ?, completed_at = ? WHERE id = ?")
    .bind(status, error ?? null, status === 'completed' || status === 'failed' ? new Date().toISOString() : null, id)
    .run();
}
