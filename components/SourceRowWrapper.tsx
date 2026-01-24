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
  expectedResults?: number | null;
  homepage?: string | null;
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
  formatDate: (dateStr: string | null) => string;
  handleSync: (formData: FormData) => Promise<void>;
  handleToggle: (formData: FormData) => Promise<void>;
  handleSourceSync: (formData: FormData) => Promise<void>;
  handleSourceUpdate: (formData: FormData) => Promise<void>;
  handleRowSync: (formData: FormData) => Promise<void>;
  integrationTypeOptions: readonly IntegrationTypeOption[];
}

export default function SourceRowWrapper({
  source,
  status,
  statusColor,
  statusLabel,
  formatDate,
  handleSync,
  handleToggle,
  handleSourceSync,
  handleSourceUpdate,
  handleRowSync,
  integrationTypeOptions
}: SourceRowWrapperProps) {
  const [isToggling] = useTransition();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <tr
        style={{
          borderBottom: "1px solid var(--border)",
          opacity: isToggling ? 0.6 : 1,
          transition: "opacity 0.2s ease"
        }}
      >
        <td style={{ padding: "12px 8px", textAlign: "center" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: statusColor,
              display: "inline-block",
              boxShadow: status === "syncing" ? `0 0 8px ${statusColor}` : "none",
              animation: status === "syncing" ? "pulse 2s infinite" : "none"
            }}
            title={statusLabel}
          />
        </td>
        <td style={{ padding: "12px 16px" }}>
          <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>
            {source.name}
          </div>
          <div className="muted" style={{ fontSize: "11px", marginBottom: "4px" }}>
            {source.country ?? "Global"} • {source.id}
          </div>
          <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: "1.4" }}>
            {getSourceDescription(source.id)}
          </div>
        </td>
        <td style={{ padding: "12px 16px" }}>
          <div style={{ fontSize: "13px", fontWeight: 500, color: statusColor }}>
            {statusLabel}
          </div>
          {source.lastError && status === "failed" && (
            <div className="muted" style={{ fontSize: "11px", marginTop: "2px" }}>
              {source.lastError.length > 50 ? `${source.lastError.substring(0, 50)}...` : source.lastError}
            </div>
          )}
        </td>
        <td style={{ padding: "12px 16px", fontSize: "13px" }}>
          {formatDate(source.lastSync)}
        </td>
        <td style={{ padding: "12px 16px", textAlign: "right", fontSize: "13px", fontWeight: 500 }}>
          {source.lastIngested.toLocaleString()}
        </td>
        <td style={{ padding: "12px 16px" }}>
          <span className="pill" style={{ fontSize: "10px", padding: "3px 8px" }}>
            {source.integrationType}
          </span>
        </td>
        <td style={{ padding: "12px 16px", textAlign: "center" }}>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
            <SourceRowActions
              sourceId={source.id}
              active={source.active}
              syncAction={handleSync}
              toggleAction={handleToggle}
            />
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="button button--secondary"
              style={{
                padding: "6px 12px",
                fontSize: "12px",
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
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={7} style={{ padding: "0", borderBottom: "1px solid var(--border)" }}>
            <div style={{ padding: "20px", background: "#f8fafc", borderTop: "1px solid var(--border)" }}>
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
