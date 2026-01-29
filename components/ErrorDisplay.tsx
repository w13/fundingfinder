"use client";

import { useState, useEffect } from "react";
import { errorLogger, type ErrorLog } from "../lib/errors/errorLogger";

interface ErrorDisplayProps {
  maxErrors?: number;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export default function ErrorDisplay({ 
  maxErrors = 5, 
  autoHide = false, 
  autoHideDelay = 5000 
}: ErrorDisplayProps) {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Subscribe to new errors
    const unsubscribe = errorLogger.subscribe((log) => {
      setErrors((prev) => {
        const newErrors = [log, ...prev].slice(0, maxErrors);
        return newErrors;
      });

      // Auto-hide low severity errors
      if (autoHide && log.severity === "low") {
        setTimeout(() => {
          setErrors((prev) => prev.filter((e) => e.id !== log.id));
        }, autoHideDelay);
      }
    });

    // Load recent errors on mount
    const recent = errorLogger.getRecentLogs(maxErrors);
    setErrors(recent);

    return unsubscribe;
  }, [maxErrors, autoHide, autoHideDelay]);

  if (errors.length === 0) {
    return null;
  }

  const criticalErrors = errors.filter((e) => e.severity === "critical" || e.severity === "high");
  const hasCritical = criticalErrors.length > 0;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 1000,
        maxWidth: "400px",
        display: "flex",
        flexDirection: "column",
        gap: "8px"
      }}
    >
      {!isExpanded && errors.length > 0 && (
        <button
          onClick={() => setIsExpanded(true)}
          style={{
            padding: "12px 16px",
            background: hasCritical ? "var(--error)" : "var(--warning)",
            color: "#fff",
            border: "none",
            borderRadius: "0",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 600,
            boxShadow: "var(--shadow-md)",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {errors.length} error{errors.length !== 1 ? "s" : ""}
        </button>
      )}

      {isExpanded && (
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--border)",
            borderRadius: "0",
            boxShadow: "var(--shadow-lg)",
            maxHeight: "500px",
            overflow: "auto"
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#f8fafc"
            }}
          >
            <div style={{ fontWeight: 600, fontSize: "14px" }}>
              Error Log ({errors.length})
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center"
              }}
              title="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div style={{ padding: "8px" }}>
            {errors.map((error) => (
              <div
                key={error.id}
                style={{
                  padding: "10px 12px",
                  marginBottom: "8px",
                  background: error.severity === "critical" || error.severity === "high" 
                    ? "#fef2f2" 
                    : error.severity === "medium"
                    ? "#fffbeb"
                    : "#f0f9ff",
                  border: `1px solid ${
                    error.severity === "critical" || error.severity === "high"
                      ? "#fecaca"
                      : error.severity === "medium"
                      ? "#fde68a"
                      : "#bae6fd"
                  }`,
                  borderRadius: "0",
                  fontSize: "12px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "4px" }}>
                  <div style={{ fontWeight: 600, color: "var(--text)" }}>
                    {error.message}
                  </div>
                  <span
                    style={{
                      padding: "2px 6px",
                      background: error.severity === "critical" || error.severity === "high"
                        ? "#ef4444"
                        : error.severity === "medium"
                        ? "#f59e0b"
                        : "#3b82f6",
                      color: "#fff",
                      fontSize: "10px",
                      fontWeight: 600,
                      textTransform: "uppercase"
                    }}
                  >
                    {error.severity}
                  </span>
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: "11px", marginTop: "4px" }}>
                  {new Date(error.timestamp).toLocaleTimeString()}
                </div>
                {error.context?.component && (
                  <div style={{ color: "var(--text-secondary)", fontSize: "11px", marginTop: "2px" }}>
                    Component: {error.context.component}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div
            style={{
              padding: "8px 12px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#f8fafc"
            }}
          >
            <button
              onClick={() => {
                errorLogger.clearLogs();
                setErrors([]);
              }}
              className="button button--secondary button--small"
              style={{ fontSize: "11px" }}
            >
              Clear All
            </button>
            <button
              onClick={() => {
                const stats = errorLogger.getStats();
                console.log("Error Statistics:", stats);
                alert(`Total Errors: ${stats.total}\nCritical: ${stats.bySeverity.critical}\nHigh: ${stats.bySeverity.high}\nMedium: ${stats.bySeverity.medium}\nLow: ${stats.bySeverity.low}`);
              }}
              className="button button--secondary button--small"
              style={{ fontSize: "11px" }}
            >
              View Stats
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
