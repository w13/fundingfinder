import type { NotificationChannel } from "../types";
import { safeJsonParse } from "../utils";

export async function listNotificationChannels(db: D1Database): Promise<NotificationChannel[]> {
  const results = await db
    .prepare(
      `SELECT
        id,
        name,
        type,
        config,
        severity_threshold as severityThreshold,
        active,
        created_at as createdAt,
        updated_at as updatedAt
      FROM notification_channels
      ORDER BY created_at DESC`
    )
    .all<{
      id: string;
      name: string;
      type: "webhook" | "slack" | "email";
      config: string;
      severityThreshold: "low" | "medium" | "high" | "critical";
      active: number;
      createdAt: string;
      updatedAt: string;
    }>();

  return (
    results.results?.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      config: safeJsonParse<Record<string, unknown>>(row.config) ?? {},
      severityThreshold: row.severityThreshold,
      active: Boolean(row.active),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    })) ?? []
  );
}

export async function insertNotificationChannel(
  db: D1Database,
  payload: Omit<NotificationChannel, "id" | "createdAt" | "updatedAt">
): Promise<NotificationChannel> {
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO notification_channels (
        id, name, type, config, severity_threshold, active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      payload.name,
      payload.type,
      JSON.stringify(payload.config ?? {}),
      payload.severityThreshold,
      payload.active ? 1 : 0,
      timestamp,
      timestamp
    )
    .run();

  return {
    ...payload,
    id,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export async function updateNotificationChannel(
  db: D1Database,
  id: string,
  updates: Partial<Pick<NotificationChannel, "name" | "type" | "config" | "severityThreshold" | "active">>
): Promise<boolean> {
  const fields: string[] = [];
  const values: Array<string | number | null> = [];

  if (typeof updates.name !== "undefined") {
    fields.push("name = ?");
    values.push(updates.name);
  }
  if (typeof updates.type !== "undefined") {
    fields.push("type = ?");
    values.push(updates.type);
  }
  if (typeof updates.config !== "undefined") {
    fields.push("config = ?");
    values.push(updates.config ? JSON.stringify(updates.config) : "{}");
  }
  if (typeof updates.severityThreshold !== "undefined") {
    fields.push("severity_threshold = ?");
    values.push(updates.severityThreshold);
  }
  if (typeof updates.active === "boolean") {
    fields.push("active = ?");
    values.push(updates.active ? 1 : 0);
  }

  if (fields.length === 0) return false;

  fields.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  const result = await db
    .prepare(`UPDATE notification_channels SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();

  return Boolean(result.meta?.changes);
}

export async function deleteNotificationChannel(db: D1Database, id: string): Promise<boolean> {
  const result = await db.prepare("DELETE FROM notification_channels WHERE id = ?").bind(id).run();
  return Boolean(result.meta?.changes);
}
