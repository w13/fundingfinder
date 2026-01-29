import { getNextPendingTask, updateTaskStatus } from "../db/tasks";
import { runSourceSync } from "./sync";
import type { Env, SyncSourcePayload } from "../types";

const SCHEDULER_TIMEOUT_MS = 50000;

function isSyncSourcePayload(payload: unknown): payload is SyncSourcePayload {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as Record<string, unknown>;
  return typeof p.sourceId === "string" && (p.options === undefined || typeof p.options === "object");
}

export async function processPendingTasks(env: Env, ctx: ExecutionContext): Promise<void> {
  const startTime = Date.now();

  // Process tasks for up to SCHEDULER_TIMEOUT_MS
  while (Date.now() - startTime < SCHEDULER_TIMEOUT_MS) {
    const task = await getNextPendingTask(env.DB);
    if (!task) break;

    try {
      if (task.type === "sync_source") {
        if (!isSyncSourcePayload(task.payload)) {
          throw new Error(`Invalid sync_source payload: ${JSON.stringify(task.payload)}`);
        }
        const { sourceId, options } = task.payload;
        await runSourceSync(env, ctx, sourceId, options ?? {});
      } else {
        console.warn(`Unknown task type: ${task.type}`);
      }

      await updateTaskStatus(env.DB, task.id, "completed");
    } catch (error) {
      console.error(`Task ${task.id} failed:`, error);
      await updateTaskStatus(env.DB, task.id, "failed", error instanceof Error ? error.message : String(error));
    }
  }
}
