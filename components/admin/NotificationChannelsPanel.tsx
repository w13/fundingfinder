"use client";

import { useState } from "react";
import type { NotificationChannel } from "../../lib/domain/types";
import { createNotificationChannel, deleteNotificationChannel, updateNotificationChannel } from "../../lib/api/admin";
import { useErrorLogger } from "../../lib/errors/useErrorLogger";

type NotificationChannelsPanelProps = {
  initialChannels: NotificationChannel[];
  readOnly?: boolean;
};

export default function NotificationChannelsPanel({ initialChannels, readOnly = false }: NotificationChannelsPanelProps) {
  const { logWarning } = useErrorLogger("NotificationChannelsPanel");
  const [channels, setChannels] = useState<NotificationChannel[]>(initialChannels);
  const [form, setForm] = useState({
    name: "",
    type: "webhook",
    url: "",
    severity: "high"
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleCreate = async () => {
    if (readOnly) return;
    setIsSaving(true);
    const result = await createNotificationChannel({
      name: form.name.trim(),
      type: form.type as NotificationChannel["type"],
      config: { url: form.url.trim() },
      severityThreshold: form.severity as NotificationChannel["severityThreshold"],
      active: true
    });
    if (result.warning) {
      logWarning(result.warning, { action: "create-channel" });
    }
    if (result.channel) {
      setChannels((prev) => [result.channel!, ...prev]);
      setForm({ name: "", type: "webhook", url: "", severity: "high" });
    }
    setIsSaving(false);
  };

  const handleToggle = async (channel: NotificationChannel) => {
    if (readOnly) return;
    const result = await updateNotificationChannel({
      id: channel.id,
      active: !channel.active
    });
    if (result.warning) {
      logWarning(result.warning, { action: "toggle-channel" });
    }
    if (result.updated) {
      setChannels((prev) => prev.map((item) => (item.id === channel.id ? { ...item, active: !item.active } : item)));
    }
  };

  const handleDelete = async (id: string) => {
    if (readOnly) return;
    const result = await deleteNotificationChannel(id);
    if (result.warning) {
      logWarning(result.warning, { action: "delete-channel" });
    }
    if (result.deleted) {
      setChannels((prev) => prev.filter((item) => item.id !== id));
    }
  };

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Notification channels</h3>
      <p className="muted" style={{ marginTop: "4px" }}>
        Configure Slack, email, or webhook channels with severity thresholds.
      </p>

      <div className="grid grid-2" style={{ marginTop: "16px" }}>
        <label style={{ display: "grid", gap: "6px" }}>
          <span className="pill">Name</span>
          <input
            className="input"
            value={form.name}
            disabled={readOnly}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Ops Slack"
          />
        </label>
        <label style={{ display: "grid", gap: "6px" }}>
          <span className="pill">Type</span>
          <select
            className="select"
            value={form.type}
            disabled={readOnly}
            onChange={(event) => setForm({ ...form, type: event.target.value })}
          >
            <option value="webhook">Webhook</option>
            <option value="slack">Slack</option>
            <option value="email">Email</option>
          </select>
        </label>
        <label style={{ display: "grid", gap: "6px" }}>
          <span className="pill">Endpoint URL</span>
          <input
            className="input"
            value={form.url}
            disabled={readOnly}
            onChange={(event) => setForm({ ...form, url: event.target.value })}
            placeholder="https://hooks.slack.com/..."
          />
        </label>
        <label style={{ display: "grid", gap: "6px" }}>
          <span className="pill">Severity Threshold</span>
          <select
            className="select"
            value={form.severity}
            disabled={readOnly}
            onChange={(event) => setForm({ ...form, severity: event.target.value })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </label>
      </div>

      <button className="button" type="button" disabled={readOnly || isSaving || !form.name || !form.url} onClick={handleCreate} style={{ marginTop: "12px" }}>
        {isSaving ? "Saving..." : "Add channel"}
      </button>

      <div style={{ marginTop: "20px", display: "grid", gap: "10px" }}>
        {channels.length === 0 ? (
          <div style={{ padding: "12px", background: "#f8fafc", border: "1px solid var(--border-light)" }}>
            <p className="muted" style={{ margin: 0, fontSize: "13px" }}>
              No notification channels configured yet.
            </p>
          </div>
        ) : (
          channels.map((channel) => (
            <div
              key={channel.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                border: "1px solid var(--border-light)",
                background: "#fff"
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: "14px" }}>{channel.name}</div>
                <div className="muted" style={{ fontSize: "12px" }}>
                  {channel.type} · threshold {channel.severityThreshold}
                </div>
                {"url" in channel.config && (
                  <div className="muted" style={{ fontSize: "11px" }}>
                    {(channel.config as { url?: string }).url}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="button button--secondary button--small" type="button" disabled={readOnly} onClick={() => handleToggle(channel)}>
                  {channel.active ? "Disable" : "Enable"}
                </button>
                <button className="button button--secondary button--small" type="button" disabled={readOnly} onClick={() => handleDelete(channel.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
