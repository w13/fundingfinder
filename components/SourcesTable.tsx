"use client";

import { useState, useMemo } from "react";
import SourceRowWrapper from "./SourceRowWrapper";
import type { FundingSource, SourceHealthSummary } from "../lib/domain/types";

type SyncStatus = "syncing" | "scheduled" | "success" | "failed" | "manual" | "inactive" | "never";

type IntegrationTypeOption = {
  readonly value: string;
  readonly label: string;
};

type FundingSourceWithStatus = FundingSource & {
  syncStatus: SyncStatus;
  statusColor: string;
  statusLabel: string;
  health?: SourceHealthSummary;
};

interface SourcesTableProps {
  sources: FundingSourceWithStatus[];
  handleSync: (formData: FormData) => Promise<void>;
  handleToggle: (formData: FormData) => Promise<void>;
  handleSourceSync: (formData: FormData) => Promise<void>;
  handleSourceUpdate: (formData: FormData) => Promise<void>;
  handleRowSync: (formData: FormData) => Promise<void>;
  integrationTypeOptions: readonly IntegrationTypeOption[];
  toggleAllComponent?: React.ReactNode;
  readOnly?: boolean;
}

type SortField = "name" | "status" | "lastSync" | "lastIngested" | "integrationType" | "active" | null;
type SortDirection = "asc" | "desc";

export default function SourcesTable({
  sources,
  handleSync,
  handleToggle,
  handleSourceSync,
  handleSourceUpdate,
  handleRowSync,
  integrationTypeOptions,
  toggleAllComponent,
  readOnly = false
}: SourcesTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Filter sources based on search query
  const filteredSources = useMemo(() => {
    if (!searchQuery.trim()) return sources;
    
    const query = searchQuery.toLowerCase().trim();
    return sources.filter((source) => {
      const name = source.name.toLowerCase();
      const id = source.id.toLowerCase();
      const country = (source.country ?? "").toLowerCase();
      const type = source.integrationType.toLowerCase();
      
      return name.includes(query) || 
             id.includes(query) || 
             country.includes(query) || 
             type.includes(query);
    });
  }, [sources, searchQuery]);

  // Sort filtered sources
  const sortedSources = useMemo(() => {
    if (!sortField) return filteredSources;
    
    return [...filteredSources].sort((a, b) => {
      let aValue: string | number | boolean | null;
      let bValue: string | number | boolean | null;
      
      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "status":
          aValue = a.statusLabel;
          bValue = b.statusLabel;
          break;
        case "lastSync":
          aValue = a.lastSync ? new Date(a.lastSync).getTime() : 0;
          bValue = b.lastSync ? new Date(b.lastSync).getTime() : 0;
          break;
        case "lastIngested":
          aValue = a.lastIngested;
          bValue = b.lastIngested;
          break;
        case "integrationType":
          aValue = a.integrationType.toLowerCase();
          bValue = b.integrationType.toLowerCase();
          break;
        case "active":
          aValue = a.active ? 1 : 0;
          bValue = b.active ? 1 : 0;
          break;
        default:
          return 0;
      }
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;
      
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredSources, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field with ascending direction
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
          <path d="M8 9l4-4 4 4M8 15l4 4 4-4" />
        </svg>
      );
    }
    if (sortDirection === "asc") {
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 9l4-4 4 4" />
        </svg>
      );
    }
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 15l4 4 4-4" />
      </svg>
    );
  };

  return (
    <div className="card" style={{ padding: "0", overflow: "hidden" }}>
      {/* Enable All Toggle */}
      {toggleAllComponent && (
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>Enable All:</span>
          {toggleAllComponent}
        </div>
      )}
      
      {/* Search Bar */}
      <div style={{ padding: "16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ position: "relative", maxWidth: "400px" }}>
          <input
            type="text"
            className="input"
            placeholder="Search sources by name, ID, country, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              paddingLeft: "36px",
              width: "100%"
            }}
          />
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--muted)",
              pointerEvents: "none"
            }}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                color: "var(--muted)"
              }}
              title="Clear search"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        {searchQuery && (
          <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--text-secondary)" }}>
            Showing {sortedSources.length} of {sources.length} sources
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table className="table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th 
                style={{ 
                  padding: "12px 16px", 
                  textAlign: "center", 
                  width: "120px", 
                  cursor: "pointer", 
                  userSelect: "none",
                  transition: "background-color 0.2s ease"
                }}
                onClick={() => handleSort("active")}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ""}
                title="Click to sort"
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                  Enable
                  {getSortIcon("active")}
                </div>
              </th>
              <th 
                style={{ 
                  padding: "12px 16px", 
                  textAlign: "left", 
                  cursor: "pointer", 
                  userSelect: "none",
                  transition: "background-color 0.2s ease"
                }}
                onClick={() => handleSort("name")}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ""}
                title="Click to sort"
              >
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  Source
                  {getSortIcon("name")}
                </div>
              </th>
              <th 
                style={{ 
                  padding: "12px 16px", 
                  textAlign: "left", 
                  cursor: "pointer", 
                  userSelect: "none",
                  transition: "background-color 0.2s ease"
                }}
                onClick={() => handleSort("status")}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ""}
                title="Click to sort"
              >
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  Status
                  {getSortIcon("status")}
                </div>
              </th>
              <th 
                style={{ 
                  padding: "12px 16px", 
                  textAlign: "left", 
                  width: "140px", 
                  cursor: "pointer", 
                  userSelect: "none",
                  transition: "background-color 0.2s ease"
                }}
                onClick={() => handleSort("lastSync")}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ""}
                title="Click to sort"
              >
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  Last Sync
                  {getSortIcon("lastSync")}
                </div>
              </th>
              <th 
                style={{ 
                  padding: "12px 16px", 
                  textAlign: "right", 
                  cursor: "pointer", 
                  userSelect: "none",
                  transition: "background-color 0.2s ease"
                }}
                onClick={() => handleSort("lastIngested")}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ""}
                title="Click to sort"
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                  Ingested
                  {getSortIcon("lastIngested")}
                </div>
              </th>
              <th 
                style={{ 
                  padding: "12px 16px", 
                  textAlign: "left", 
                  cursor: "pointer", 
                  userSelect: "none",
                  transition: "background-color 0.2s ease"
                }}
                onClick={() => handleSort("integrationType")}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ""}
                title="Click to sort"
              >
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  Type
                  {getSortIcon("integrationType")}
                </div>
              </th>
              <th style={{ padding: "12px 16px", textAlign: "center", width: "120px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedSources.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "40px 16px", textAlign: "center", color: "var(--text-secondary)" }}>
                  {searchQuery ? `No sources found matching "${searchQuery}"` : "No sources available"}
                </td>
              </tr>
            ) : (
              sortedSources.map((source) => {
                return (
                  <SourceRowWrapper
                    key={source.id}
                    source={{
                      ...source,
                      expectedResults: source.expectedResults ?? null,
                      homepage: source.homepage ?? null
                    }}
                    status={source.syncStatus}
                    statusColor={source.statusColor}
                    statusLabel={source.statusLabel}
                    health={source.health}
                    readOnly={readOnly}
                    handleSync={handleSync}
                    handleToggle={handleToggle}
                    handleSourceSync={handleSourceSync}
                    handleSourceUpdate={handleSourceUpdate}
                    handleRowSync={handleRowSync}
                    integrationTypeOptions={integrationTypeOptions}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
