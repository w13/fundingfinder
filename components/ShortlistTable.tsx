"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { ShortlistItem } from "../lib/domain/types";
import { ScoreBadge } from "./ScoreBadge";
import { formatSourceLabel } from "../lib/domain/format";

type SortField = "title" | "agency" | "source" | "feasibilityScore" | "suitabilityScore" | "profitabilityScore" | "postedDate" | "dueDate";
type SortDirection = "asc" | "desc";

interface ShortlistTableProps {
  items: ShortlistItem[];
  onRemove: (formData: FormData) => Promise<void>;
}

export default function ShortlistTable({ items, onRemove }: ShortlistTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("feasibilityScore");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;

    const query = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.agency?.toLowerCase().includes(query) ||
        item.source.toLowerCase().includes(query) ||
        item.summary?.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  const sortedItems = useMemo(() => {
    const sorted = [...filteredItems].sort((a, b) => {
      let aVal: string | number | null;
      let bVal: string | number | null;

      switch (sortField) {
        case "title":
          aVal = a.title;
          bVal = b.title;
          break;
        case "agency":
          aVal = a.agency ?? "";
          bVal = b.agency ?? "";
          break;
        case "source":
          aVal = a.source;
          bVal = b.source;
          break;
        case "feasibilityScore":
          aVal = a.feasibilityScore ?? -1;
          bVal = b.feasibilityScore ?? -1;
          break;
        case "suitabilityScore":
          aVal = a.suitabilityScore ?? -1;
          bVal = b.suitabilityScore ?? -1;
          break;
        case "profitabilityScore":
          aVal = a.profitabilityScore ?? -1;
          bVal = b.profitabilityScore ?? -1;
          break;
        case "postedDate":
          aVal = a.postedDate ?? "";
          bVal = b.postedDate ?? "";
          break;
        case "dueDate":
          aVal = a.dueDate ?? "";
          bVal = b.dueDate ?? "";
          break;
        default:
          return 0;
      }

      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

    return sorted;
  }, [filteredItems, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const toggleExpanded = (shortlistId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(shortlistId)) {
        next.delete(shortlistId);
      } else {
        next.add(shortlistId);
      }
      return next;
    });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return (
      <span style={{ marginLeft: "4px", display: "inline-block" }}>
        {sortDirection === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            maxWidth: "400px"
          }}
        >
          <input
            type="text"
            placeholder="Search opportunities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 32px 8px 12px",
              border: "1px solid var(--border)",
              borderRadius: "0",
              fontSize: "13px"
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: "8px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center"
              }}
              title="Clear search"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--text-secondary)" }}>
          Showing {filteredItems.length} of {items.length} opportunities
        </div>
      </div>

      {sortedItems.length === 0 ? (
        <div className="card">
          <p style={{ margin: 0, color: "var(--text-secondary)" }}>
            {searchQuery ? "No opportunities match your search." : "No opportunities shortlisted yet."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {sortedItems.map((item) => {
            const isExpanded = expandedItems.has(item.shortlistId);
            const analysisSummary = Array.isArray(item.analysisSummary) ? item.analysisSummary : [];
            const constraints = Array.isArray(item.constraints) ? item.constraints : [];
            const hasAnalysis = item.analyzed && (item.feasibilityScore !== null || analysisSummary.length > 0);

            return (
              <div key={item.shortlistId} className="card" style={{ padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <div style={{ display: "flex", alignItems: "start", gap: "8px", marginBottom: "8px" }}>
                      <h3 style={{ margin: 0, fontSize: "16px", flex: 1 }}>{item.title}</h3>
                      {hasAnalysis && (
                        <span
                          style={{
                            padding: "2px 6px",
                            background: "#10b981",
                            color: "#fff",
                            fontSize: "10px",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            borderRadius: "0"
                          }}
                        >
                          Analyzed
                        </span>
                      )}
                    </div>
                    <p style={{ margin: "4px 0", fontSize: "13px", color: "var(--text-secondary)" }}>
                      {item.agency ?? "Unknown agency"} · {formatSourceLabel(item.source)}
                    </p>
                    {item.summary && (
                      <p style={{ margin: "8px 0 0", fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                        {item.summary.length > 200 ? `${item.summary.slice(0, 200)}...` : item.summary}
                      </p>
                    )}
                    <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
                      <ScoreBadge label="Feasibility" value={item.feasibilityScore} />
                      <ScoreBadge label="Suitability" value={item.suitabilityScore} />
                      <ScoreBadge label="Profitability" value={item.profitabilityScore} />
                    </div>
                    <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "var(--text-secondary)", marginTop: "8px", flexWrap: "wrap" }}>
                      {item.postedDate && <span>Posted: {new Date(item.postedDate).toLocaleDateString()}</span>}
                      {item.dueDate && <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <Link
                      href={`/opportunities/${item.opportunityRecordId}`}
                      className="button button--secondary"
                      style={{ fontSize: "13px", textDecoration: "none" }}
                    >
                      View Details
                    </Link>
                    {hasAnalysis && (
                      <button
                        onClick={() => toggleExpanded(item.shortlistId)}
                        className="button button--secondary"
                        style={{ fontSize: "13px" }}
                      >
                        {isExpanded ? "Hide Analysis" : "Show Analysis"}
                      </button>
                    )}
                    <form action={onRemove} style={{ margin: 0 }}>
                      <input type="hidden" name="shortlistId" value={item.shortlistId} />
                      <button
                        type="submit"
                        className="button button--secondary"
                        style={{ fontSize: "13px" }}
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                </div>

                {isExpanded && hasAnalysis && (
                  <div
                    style={{
                      marginTop: "16px",
                      paddingTop: "16px",
                      borderTop: "1px solid var(--border)"
                    }}
                  >
                    {analysisSummary.length > 0 && (
                      <div style={{ marginBottom: "16px" }}>
                        <h4 style={{ margin: 0, marginBottom: "8px", fontSize: "14px", fontWeight: 600 }}>
                          AI Analysis Summary
                        </h4>
                        <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", lineHeight: "1.6" }}>
                          {analysisSummary.map((bullet, idx) => (
                            <li key={idx} style={{ marginBottom: "4px" }}>
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {constraints.length > 0 && (
                      <div>
                        <h4 style={{ margin: 0, marginBottom: "8px", fontSize: "14px", fontWeight: 600 }}>
                          Key Constraints
                        </h4>
                        <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", lineHeight: "1.6" }}>
                          {constraints.map((constraint, idx) => (
                            <li key={idx} style={{ marginBottom: "4px" }}>
                              {constraint}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
