"use client";

import { useTransition, useState } from "react";
import SourceRowActions from "./SourceRowActions";
import { getSourceDescription } from "../lib/sourceDescriptions";

type Source = {
  id: string;
  name: string;
  country: string | null;
  active: boolean;
  lastSync: string | null;
  lastStatus: string | null;
  lastError: string | null;
  lastIngested: number;
  integrationType: string;
  autoUrl: string | null;
  expectedResults: number | null;
  homepage: string | null;
};

type SyncStatus = "syncing" | "scheduled" | "success" | "failed" | "manual" | "inactive" | "never";

type IntegrationTypeOption = {
  readonly value: string;
  readonly label: string;
};

interface SourceRowWrapperProps {
  source: Source;
  status: SyncStatus;
  statusColor: string;
  statusLabel: string;
  handleSync: (formData: FormData) => Promise<void>;
  handleToggle: (formData: FormData) => Promise<void>;
  handleSourceSync: (formData: FormData) => Promise<void>;
  handleSourceUpdate: (formData: FormData) => Promise<void>;
  handleRowSync: (formData: FormData) => Promise<void>;
  integrationTypeOptions: readonly IntegrationTypeOption[];
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function SourceRowWrapper({
  source,
  status,
  statusColor,
  statusLabel,
  handleSync,
  handleToggle,
  handleSourceSync,
  handleSourceUpdate,
  handleRowSync,
  integrationTypeOptions
}: SourceRowWrapperProps) {
  const [isToggling] = useTransition();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncClick = (e: React.FormEvent<HTMLFormElement>) => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 3000);
  };

  return (
    <>
      <tr
        style={{
          borderBottom: "1px solid var(--border)",
          opacity: isToggling ? 0.6 : 1,
          transition: "opacity 0.2s ease"
        }}
      >
        <td style={{ padding: "16px", textAlign: "center" }}>
          <form action={handleToggle} style={{ margin: 0 }}>
            <input type="hidden" name="sourceId" value={source.id} />
            <input type="hidden" name="active" value={source.active ? "false" : "true"} />
            <button
              type="submit"
              className="toggle-button"
              disabled={isToggling}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 8px",
                fontSize: "12px",
                fontWeight: 500,
                border: "none",
                background: "transparent",
                cursor: isToggling ? "wait" : "pointer",
                color: source.active ? "var(--primary)" : "var(--muted)",
                borderRadius: "0",
                transition: "all 0.2s ease",
                opacity: isToggling ? 0.6 : 1
              }}
              title={source.active ? "Disable source" : "Enable source"}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "44px",
                  height: "24px",
                  borderRadius: "0",
                  backgroundColor: source.active ? "var(--primary)" : "#cbd5e1",
                  position: "relative",
                  transition: "background-color 0.2s ease"
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    width: "18px",
                    height: "18px",
                    borderRadius: "0",
                    background: "white",
                    top: "3px",
                    left: source.active ? "23px" : "3px",
                    transition: "left 0.2s ease",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)"
                  }}
                />
              </span>
              <span>{source.active ? "On" : "Off"}</span>
            </button>
          </form>
        </td>
        <td style={{ padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: statusColor,
                display: "inline-block",
                flexShrink: 0,
                boxShadow: status === "syncing" ? `0 0 6px ${statusColor}` : "none",
                animation: status === "syncing" ? "pulse 2s infinite" : "none"
              }}
              title={statusLabel}
            />
            <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text)" }}>
              {source.name}
            </div>
          </div>
          <div className="muted" style={{ fontSize: "12px", marginBottom: "6px", marginLeft: "18px" }}>
            {source.country ?? "Global"} • {source.id}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5", marginLeft: "18px" }}>
            {getSourceDescription(source.id)}
          </div>
        </td>
        <td style={{ padding: "16px" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: statusColor, marginBottom: "4px" }}>
            {statusLabel}
          </div>
          {source.lastError && status === "failed" && (
            <div className="muted" style={{ fontSize: "11px", marginTop: "4px", lineHeight: "1.4" }}>
              {source.lastError.length > 50 ? `${source.lastError.substring(0, 50)}...` : source.lastError}
            </div>
          )}
        </td>
        <td style={{ padding: "16px", fontSize: "13px", color: "var(--text-secondary)" }}>
          <div style={{ marginBottom: "8px" }}>{formatDate(source.lastSync)}</div>
          <form action={handleSync} onSubmit={handleSyncClick} style={{ margin: 0 }}>
            <input type="hidden" name="sourceId" value={source.id} />
            <button
              className="button button--small"
              type="submit"
              disabled={isSyncing}
              style={{
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                width: "100%",
                justifyContent: "center",
                opacity: isSyncing ? 0.6 : 1,
                cursor: isSyncing ? "not-allowed" : "pointer"
              }}
              title="Sync this source now"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  animation: isSyncing ? "spin 1s linear infinite" : "none"
                }}
              >
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
              </svg>
              {isSyncing ? "Syncing..." : "Sync"}
            </button>
          </form>
        </td>
        <td style={{ padding: "16px", textAlign: "right", fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
          {source.lastIngested.toLocaleString()}
        </td>
        <td style={{ padding: "16px" }}>
          <span className="pill">
            {source.integrationType}
          </span>
        </td>
        <td style={{ padding: "16px", textAlign: "center" }}>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="button button--secondary button--small"
            style={{
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}
            title="Show settings"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease"
              }}
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
            Settings
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={7} style={{ padding: "0", borderBottom: "1px solid var(--border-light)" }}>
            <div style={{ padding: "24px", background: "#f8fafc", borderTop: "1px solid var(--border-light)" }}>
              <div className="grid grid-4" style={{ gap: "12px", marginBottom: "16px" }}>
                <div>
                  <p className="muted" style={{ fontSize: "10px", margin: "0 0 4px" }}>Auto URL</p>
                  <p style={{ margin: 0, fontSize: "12px", wordBreak: "break-word" }}>{source.autoUrl ?? "Not set"}</p>
                </div>
                <div>
                  <p className="muted" style={{ fontSize: "10px", margin: "0 0 4px" }}>Last sync</p>
                  <p style={{ margin: 0, fontSize: "12px" }}>{source.lastSync ?? "—"}</p>
                </div>
                <div>
                  <p className="muted" style={{ fontSize: "10px", margin: "0 0 4px" }}>Last ingested</p>
                  <p style={{ margin: 0, fontSize: "12px" }}>{source.lastIngested ?? 0}</p>
                </div>
                <div>
                  <p className="muted" style={{ fontSize: "10px", margin: "0 0 4px" }}>Expected volume</p>
                  <p style={{ margin: 0, fontSize: "12px" }}>{source.expectedResults != null ? source.expectedResults.toLocaleString() : "—"}</p>
                </div>
                <div>
                  <p className="muted" style={{ fontSize: "10px", margin: "0 0 4px" }}>Homepage</p>
                  {source.homepage ? (
                    <a href={source.homepage} target="_blank" rel="noreferrer" style={{ color: "var(--primary)", fontSize: "12px" }}>
                      Visit portal
                    </a>
                  ) : (
                    <p style={{ margin: 0, fontSize: "12px" }}>—</p>
                  )}
                </div>
                <div>
                  <p className="muted" style={{ fontSize: "10px", margin: "0 0 4px" }}>Last error</p>
                  <p style={{ margin: 0, fontSize: "12px", wordBreak: "break-word" }}>{source.lastError ?? "—"}</p>
                </div>
              </div>
              <div className="grid grid-3" style={{ gap: "12px" }}>
                <form action={handleRowSync} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <input type="hidden" name="sourceId" value={source.id} />
                  <label style={{ display: "grid", gap: "4px" }}>
                    <span className="pill" style={{ fontSize: "10px", padding: "3px 8px" }}>Max notices</span>
                    <input className="input" name="maxNotices" placeholder="500" style={{ padding: "6px 8px", fontSize: "12px" }} />
                  </label>
                  <button className="button" type="submit" style={{ padding: "6px 12px", fontSize: "12px" }}>
                    Sync now
                  </button>
                </form>
                <form action={handleSourceUpdate} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <input type="hidden" name="sourceId" value={source.id} />
                  <label style={{ display: "grid", gap: "4px" }}>
                    <span className="pill" style={{ fontSize: "10px", padding: "3px 8px" }}>Integration type</span>
                    <select className="select" name="integrationType" defaultValue={source.integrationType} style={{ padding: "6px 8px", fontSize: "12px" }}>
                      {integrationTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label style={{ display: "grid", gap: "4px" }}>
                    <span className="pill" style={{ fontSize: "10px", padding: "3px 8px" }}>Auto URL</span>
                    <input className="input" name="autoUrl" defaultValue={source.autoUrl ?? ""} style={{ padding: "6px 8px", fontSize: "12px" }} />
                  </label>
                  <label style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <input type="checkbox" name="active" defaultChecked={source.active} style={{ margin: 0 }} />
                    <span className="pill" style={{ fontSize: "10px", padding: "3px 8px" }}>Enable cron</span>
                  </label>
                  <button className="button button--secondary" type="submit" style={{ padding: "6px 12px", fontSize: "12px" }}>
                    Save settings
                  </button>
                </form>
                <form action={handleSourceSync} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <input type="hidden" name="sourceId" value={source.id} />
                  <label style={{ display: "grid", gap: "4px" }}>
                    <span className="pill" style={{ fontSize: "10px", padding: "3px 8px" }}>Download URL override</span>
                    <input className="input" name="url" placeholder="https://example.com/export.zip" style={{ padding: "6px 8px", fontSize: "12px" }} />
                  </label>
                  <label style={{ display: "grid", gap: "4px" }}>
                    <span className="pill" style={{ fontSize: "10px", padding: "3px 8px" }}>Max notices</span>
                    <input className="input" name="maxNotices" placeholder="500" style={{ padding: "6px 8px", fontSize: "12px" }} />
                  </label>
                  <button className="button button--secondary" type="submit" style={{ padding: "6px 12px", fontSize: "12px" }}>
                    Run import
                  </button>
                </form>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
