"use client";

import { useTransition, useState } from "react";
import * as Select from "@radix-ui/react-select";
import * as Checkbox from "@radix-ui/react-checkbox";
import * as Label from "@radix-ui/react-label";
import * as Separator from "@radix-ui/react-separator";
import { ChevronDownIcon, CheckIcon } from "@radix-ui/react-icons";
import SourceRowActions from "./SourceRowActions";
import SourceStatusDisplay from "./SourceStatusDisplay";
import HelpTooltip from "./HelpTooltip";
import { getSourceDescription } from "../lib/domain/sourceDescriptions";
import type { SourceHealthSummary } from "../lib/domain/types";

type Source = {
  id: string;
  name: string;
  country: string | null;
  active: boolean;
  lastSync: string | null;
  lastSuccessfulSync: string | null;
  lastStatus: string | null;
  lastError: string | null;
  lastIngested: number;
  integrationType: string;
  autoUrl: string | null;
  expectedResults: number | null;
  homepage: string | null;
  maxNotices: number | null;
  keywordIncludes: string | null;
  keywordExcludes: string | null;
  language: string | null;
  metadata: Record<string, unknown> | null;
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
  health?: SourceHealthSummary;
  readOnly?: boolean;
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
  health,
  readOnly = false,
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
  const [syncStartTime, setSyncStartTime] = useState<number | null>(null);
  const [integrationType, setIntegrationType] = useState(source.integrationType);

  const handleSyncClick = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSyncing(true);
    setSyncStartTime(Date.now());
    
    const formData = new FormData(e.currentTarget);
    
    try {
      await handleSync(formData);
      // Keep syncing state for at least 2 seconds to show feedback
      setTimeout(() => {
        setIsSyncing(false);
        setSyncStartTime(null);
      }, 2000);
    } catch (error) {
      setIsSyncing(false);
      setSyncStartTime(null);
    }
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
              disabled={isToggling || readOnly}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 8px",
                fontSize: "12px",
                fontWeight: 500,
                border: "none",
                background: "transparent",
                cursor: isToggling || readOnly ? "not-allowed" : "pointer",
                color: source.active ? "var(--primary)" : "var(--muted)",
                borderRadius: "0",
                transition: "all 0.2s ease",
                opacity: isToggling || readOnly ? 0.6 : 1
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
          <SourceStatusDisplay
            sourceId={source.id}
            sourceName={source.name}
            initialStatus={status}
            initialStatusLabel={statusLabel}
            statusColor={statusColor}
            lastError={source.lastError}
            lastIngested={source.lastIngested}
            lastSuccessfulSync={health?.lastSuccessfulSync ?? source.lastSuccessfulSync}
            errorRate={health?.errorRate ?? 0}
            ingestedLast24h={health?.ingestedLast24h ?? 0}
            isSyncing={isSyncing}
          />
        </td>
        <td style={{ padding: "16px", fontSize: "13px", color: "var(--text-secondary)" }}>
          <div style={{ marginBottom: "8px" }}>{formatDate(source.lastSync)}</div>
          <form onSubmit={handleSyncClick} style={{ margin: 0 }}>
            <input type="hidden" name="sourceId" value={source.id} />
            <button
              className="button button--small"
              type="submit"
              disabled={isSyncing || readOnly}
              style={{
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                width: "100%",
                justifyContent: "center",
                opacity: isSyncing || readOnly ? 0.6 : 1,
                cursor: isSyncing || readOnly ? "not-allowed" : "pointer"
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
            <div style={{ 
              padding: "28px", 
              background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
              borderTop: "1px solid var(--border-light)",
              borderLeft: "3px solid var(--primary)"
            }}>
              {/* Read-only Information Section */}
              <div style={{ marginBottom: "28px" }}>
                <h4 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>Source Information</h4>
                <div className="grid grid-3" style={{ gap: "16px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                      <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--text)", margin: 0 }}>Last Sync Time</label>
                    </div>
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>{formatDate(source.lastSync)}</p>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                      <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--text)", margin: 0 }}>Last Successful Sync</label>
                    </div>
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>
                      {formatDate(health?.lastSuccessfulSync ?? source.lastSuccessfulSync)}
                    </p>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                      <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--text)", margin: 0 }}>Opportunities Ingested</label>
                    </div>
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--text)", fontWeight: 600 }}>{source.lastIngested.toLocaleString()}</p>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                      <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--text)", margin: 0 }}>24h Ingested</label>
                    </div>
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>{(health?.ingestedLast24h ?? 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                      <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--text)", margin: 0 }}>Error Rate (30d)</label>
                    </div>
                    <p style={{ margin: 0, fontSize: "13px", color: health && health.errorRate > 0.2 ? "#b91c1c" : "var(--text-secondary)" }}>
                      {((health?.errorRate ?? 0) * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                      <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--text)", margin: 0 }}>Expected Volume</label>
                    </div>
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>{source.expectedResults != null ? source.expectedResults.toLocaleString() : "Not specified"}</p>
                  </div>
                  {source.homepage && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                        <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--text)", margin: 0 }}>Source Portal</label>
                      </div>
                      <a href={source.homepage} target="_blank" rel="noreferrer" style={{ color: "var(--primary)", fontSize: "13px", textDecoration: "none" }}>
                        Visit website →
                      </a>
                    </div>
                  )}
                  {source.lastError && (
                    <div style={{ gridColumn: "span 2" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                        <label style={{ fontSize: "12px", fontWeight: 500, color: "#dc2626", margin: 0 }}>Last Error</label>
                      </div>
                      <p style={{ margin: 0, fontSize: "12px", color: "#dc2626", wordBreak: "break-word" }}>{source.lastError}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Configuration Forms */}
              <Separator.Root style={{ marginTop: "24px", marginBottom: "24px", height: "2px", background: "var(--border)" }} />
              <div style={{ paddingTop: "0" }}>
                <h4 style={{ margin: "0 0 20px", fontSize: "15px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>Configuration</h4>
                <div className="grid grid-2" style={{ gap: "24px" }}>
                  {/* Source Settings Form */}
                  <form action={handleSourceUpdate} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <input type="hidden" name="sourceId" value={source.id} />
                    
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                        <Label.Root htmlFor={`integrationType-${source.id}`} style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", margin: 0 }}>
                          Data Format
                        </Label.Root>
                        <HelpTooltip content="How the source provides data: Core API (direct API access), Bulk XML/JSON (downloadable files), or Manual URL (web scraping). Changing this may require updating the Auto URL." />
                      </div>
                      <Select.Root value={integrationType} onValueChange={setIntegrationType} disabled={readOnly}>
                        <input type="hidden" name="integrationType" value={integrationType} />
                        <Select.Trigger
                          id={`integrationType-${source.id}`}
                          style={{ 
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 14px", 
                            fontSize: "13px", 
                            width: "100%",
                            background: "#fff",
                            border: "1px solid var(--border)",
                            borderRadius: "0",
                            transition: "all 0.2s ease",
                          cursor: readOnly ? "not-allowed" : "pointer",
                          opacity: readOnly ? 0.6 : 1
                          }}
                        disabled={readOnly}
                        >
                          <Select.Value />
                          <Select.Icon>
                            <ChevronDownIcon style={{ width: "12px", height: "12px" }} />
                          </Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Content
                            style={{
                              background: "#ffffff",
                              border: "1px solid var(--border)",
                              borderRadius: "0",
                              boxShadow: "var(--shadow-md)",
                              zIndex: 1000,
                              minWidth: "var(--radix-select-trigger-width)",
                              maxHeight: "300px",
                              overflow: "auto"
                            }}
                          >
                            <Select.Viewport>
                              {integrationTypeOptions.map((option) => (
                                <Select.Item
                                  key={option.value}
                                  value={option.value}
                                  style={{
                                    padding: "10px 14px",
                                    fontSize: "13px",
                                    cursor: "pointer",
                                    outline: "none"
                                  }}
                                >
                                  <Select.ItemText>{option.label}</Select.ItemText>
                                </Select.Item>
                              ))}
                            </Select.Viewport>
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                        <Label.Root htmlFor={`autoUrl-${source.id}`} style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", margin: 0 }}>
                          Automatic Download URL
                        </Label.Root>
                        <HelpTooltip content="URL that the system will automatically download data from during scheduled syncs. Required for bulk XML/JSON sources. Leave empty for Core API sources." />
                      </div>
                      <input 
                        id={`autoUrl-${source.id}`}
                        className="input" 
                        name="autoUrl" 
                        defaultValue={source.autoUrl ?? ""} 
                        placeholder="https://example.com/data/export.zip"
                        disabled={readOnly}
                        style={{ 
                          padding: "10px 14px", 
                          fontSize: "13px", 
                          width: "100%",
                          background: "#fff",
                          border: "1px solid var(--border)",
                          borderRadius: "0",
                          transition: "all 0.2s ease"
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = "var(--primary)";
                          e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "var(--border)";
                          e.target.style.boxShadow = "none";
                        }}
                      />
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                        <Label.Root htmlFor={`maxNotices-${source.id}`} style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", margin: 0 }}>
                          Default Max Notices
                        </Label.Root>
                        <HelpTooltip content="Optional per-source limit for notices ingested during scheduled runs." />
                      </div>
                      <input
                        id={`maxNotices-${source.id}`}
                        className="input"
                        name="maxNotices"
                        type="number"
                        defaultValue={source.maxNotices ?? ""}
                        placeholder="Leave empty for no limit"
                        disabled={readOnly}
                        style={{
                          padding: "10px 14px",
                          fontSize: "13px",
                          width: "100%",
                          background: "#fff",
                          border: "1px solid var(--border)",
                          borderRadius: "0",
                          transition: "all 0.2s ease"
                        }}
                      />
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                        <Label.Root htmlFor={`keywordIncludes-${source.id}`} style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", margin: 0 }}>
                          Keyword Includes
                        </Label.Root>
                        <HelpTooltip content="Comma-separated keywords to boost for this source." />
                      </div>
                      <input
                        id={`keywordIncludes-${source.id}`}
                        className="input"
                        name="keywordIncludes"
                        defaultValue={source.keywordIncludes ?? ""}
                        placeholder="ai, digital health, analytics"
                        disabled={readOnly}
                        style={{
                          padding: "10px 14px",
                          fontSize: "13px",
                          width: "100%",
                          background: "#fff",
                          border: "1px solid var(--border)",
                          borderRadius: "0",
                          transition: "all 0.2s ease"
                        }}
                      />
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                        <Label.Root htmlFor={`keywordExcludes-${source.id}`} style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", margin: 0 }}>
                          Keyword Excludes
                        </Label.Root>
                        <HelpTooltip content="Comma-separated keywords to downrank for this source." />
                      </div>
                      <input
                        id={`keywordExcludes-${source.id}`}
                        className="input"
                        name="keywordExcludes"
                        defaultValue={source.keywordExcludes ?? ""}
                        placeholder="construction, roadworks"
                        disabled={readOnly}
                        style={{
                          padding: "10px 14px",
                          fontSize: "13px",
                          width: "100%",
                          background: "#fff",
                          border: "1px solid var(--border)",
                          borderRadius: "0",
                          transition: "all 0.2s ease"
                        }}
                      />
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                        <Label.Root htmlFor={`language-${source.id}`} style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", margin: 0 }}>
                          Language Preference
                        </Label.Root>
                        <HelpTooltip content="Optional language hint for parsing or scoring." />
                      </div>
                      <input
                        id={`language-${source.id}`}
                        className="input"
                        name="language"
                        defaultValue={source.language ?? ""}
                        placeholder="en, es, fr"
                        disabled={readOnly}
                        style={{
                          padding: "10px 14px",
                          fontSize: "13px",
                          width: "100%",
                          background: "#fff",
                          border: "1px solid var(--border)",
                          borderRadius: "0",
                          transition: "all 0.2s ease"
                        }}
                      />
                    </div>

                    <div style={{ 
                      padding: "14px", 
                      background: "#fff", 
                      border: "1px solid var(--border)",
                      borderRadius: "0"
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                        <Checkbox.Root
                          name="active"
                          defaultChecked={source.active}
                          disabled={readOnly}
                          style={{
                            margin: "2px 0 0",
                            width: "18px",
                            height: "18px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: source.active ? "var(--primary)" : "#fff",
                            border: "1px solid",
                            borderColor: source.active ? "var(--primary)" : "var(--border)",
                            borderRadius: "0",
                            cursor: readOnly ? "not-allowed" : "pointer",
                            transition: "all 0.2s ease"
                          }}
                        >
                          <Checkbox.Indicator>
                            <CheckIcon style={{ width: "14px", height: "14px", color: "#fff" }} />
                          </Checkbox.Indicator>
                        </Checkbox.Root>
                        <Label.Root htmlFor={`active-${source.id}`} style={{ flex: 1, cursor: "pointer" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Enable Scheduled Syncs</span>
                            <HelpTooltip content="When enabled, this source will be automatically synced during scheduled runs (daily at 2 AM). Disable to prevent automatic syncing." />
                          </div>
                          <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                            Automatically sync this source during scheduled runs
                          </p>
                        </Label.Root>
                      </div>
                    </div>

                    <button className="button" type="submit" style={{ 
                      padding: "12px 20px", 
                      fontSize: "13px", 
                      fontWeight: 600, 
                      alignSelf: "flex-start",
                      borderRadius: "0",
                      transition: "all 0.2s ease",
                      opacity: readOnly ? 0.6 : 1,
                      cursor: readOnly ? "not-allowed" : "pointer"
                    }}>
                      Save Configuration
                    </button>
                  </form>

                  {/* Quick Sync Form */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <form action={handleRowSync} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      <input type="hidden" name="sourceId" value={source.id} />
                      
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                          <Label.Root htmlFor={`maxNotices-sync-${source.id}`} style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", margin: 0 }}>
                            Limit Records
                          </Label.Root>
                          <HelpTooltip content="Maximum number of opportunities to process during this sync. Leave empty to process all available records. Useful for testing or limiting large imports." />
                        </div>
                        <input 
                          id={`maxNotices-sync-${source.id}`}
                          className="input" 
                          name="maxNotices" 
                          type="number"
                          placeholder="Leave empty for all records" 
                          disabled={readOnly}
                          style={{ 
                            padding: "10px 14px", 
                            fontSize: "13px", 
                            width: "100%",
                            background: "#fff",
                            border: "1px solid var(--border)",
                            borderRadius: "0",
                            transition: "all 0.2s ease"
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = "var(--primary)";
                            e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "var(--border)";
                            e.target.style.boxShadow = "none";
                          }}
                        />
                      </div>

                      <button className="button button--secondary" type="submit" style={{ 
                        padding: "12px 20px", 
                        fontSize: "13px", 
                        fontWeight: 600,
                        borderRadius: "0",
                        transition: "all 0.2s ease",
                        opacity: readOnly ? 0.6 : 1,
                        cursor: readOnly ? "not-allowed" : "pointer"
                      }}>
                        Sync Now
                      </button>
                    </form>

                    {/* Manual Import Form */}
                    <Separator.Root style={{ marginTop: "20px", marginBottom: "20px", height: "2px", background: "var(--border)" }} />
                    <div style={{ paddingTop: "0" }}>
                      <h5 style={{ margin: "0 0 16px", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        Manual Import
                      </h5>
                      <form action={handleSourceSync} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <input type="hidden" name="sourceId" value={source.id} />
                        
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                            <Label.Root htmlFor={`url-override-${source.id}`} style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", margin: 0 }}>
                              Download URL
                            </Label.Root>
                            <HelpTooltip content="Override the automatic download URL for this single import. Use this to import from a specific file or URL that differs from the configured Auto URL." />
                          </div>
                          <input 
                            id={`url-override-${source.id}`}
                            className="input" 
                            name="url" 
                            type="url"
                            placeholder="https://example.com/specific-export.zip" 
                            disabled={readOnly}
                            style={{ 
                              padding: "10px 14px", 
                              fontSize: "13px", 
                              width: "100%",
                              background: "#fff",
                              border: "1px solid var(--border)",
                              borderRadius: "0",
                              transition: "all 0.2s ease"
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = "var(--primary)";
                              e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = "var(--border)";
                              e.target.style.boxShadow = "none";
                            }}
                          />
                        </div>

                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                            <Label.Root htmlFor={`maxNotices-import-${source.id}`} style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", margin: 0 }}>
                              Limit Records
                            </Label.Root>
                            <HelpTooltip content="Maximum number of opportunities to import from this file. Leave empty to import all records from the file." />
                          </div>
                          <input 
                            id={`maxNotices-import-${source.id}`}
                            className="input" 
                            name="maxNotices" 
                            type="number"
                            placeholder="Leave empty for all records" 
                            disabled={readOnly}
                            style={{ 
                              padding: "10px 14px", 
                              fontSize: "13px", 
                              width: "100%",
                              background: "#fff",
                              border: "1px solid var(--border)",
                              borderRadius: "0",
                              transition: "all 0.2s ease"
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = "var(--primary)";
                              e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = "var(--border)";
                              e.target.style.boxShadow = "none";
                            }}
                          />
                        </div>

                        <button className="button button--secondary" type="submit" style={{ 
                          padding: "12px 20px", 
                          fontSize: "13px", 
                          fontWeight: 600,
                          borderRadius: "0",
                          transition: "all 0.2s ease",
                          opacity: readOnly ? 0.6 : 1,
                          cursor: readOnly ? "not-allowed" : "pointer"
                        }}>
                          Run Import
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
