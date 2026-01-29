"use client";

import { useEffect, useState } from "react";
import { fetchFundingSources } from "../lib/api/admin";
import { useErrorLogger } from "../lib/errors/useErrorLogger";

interface SourceStatusDisplayProps {
  sourceId: string;
  sourceName: string;
  initialStatus: string;
  initialStatusLabel: string;
  statusColor: string;
  lastError: string | null;
  lastIngested: number;
  lastSuccessfulSync?: string | null;
  errorRate?: number;
  ingestedLast24h?: number;
  isSyncing: boolean;
}

// Get descriptive message based on source name and status
function getStatusMessage(
  sourceName: string,
  status: string,
  lastIngested: number,
  lastError: string | null
): string {
  if (status === "syncing") {
    // Show source-specific messages
    const sourceMessages: Record<string, string> = {
      "Grants.gov": "Fetching federal grant opportunities...",
      "SAM.gov": "Fetching contract opportunities...",
      "HRSA": "Fetching health grants...",
      "World Bank": "Fetching procurement notices...",
      "ProZorro": "Fetching Ukrainian tenders...",
      "Contracts Finder": "Fetching UK contracts...",
      "AusTender": "Fetching Australian tenders...",
      "ChileCompra": "Fetching Chilean procurement data...",
    };
    
    return sourceMessages[sourceName] || `Fetching opportunities from ${sourceName}...`;
  }
  
  if (status === "success") {
    if (lastIngested > 0) {
      return `Complete: ${lastIngested.toLocaleString()} opportunities ingested`;
    }
    return "Sync completed";
  }
  
  if (status === "failed") {
    if (lastError) {
      // Truncate long error messages
      const maxLength = 60;
      return lastError.length > maxLength 
        ? `${lastError.substring(0, maxLength)}...` 
        : lastError;
    }
    return "Sync failed";
  }
  
  return "";
}

export default function SourceStatusDisplay({
  sourceId,
  sourceName,
  initialStatus,
  initialStatusLabel,
  statusColor,
  lastError,
  lastIngested,
  lastSuccessfulSync,
  errorRate = 0,
  ingestedLast24h = 0,
  isSyncing
}: SourceStatusDisplayProps) {
  const { logWarning } = useErrorLogger("SourceStatusDisplay");
  const [status, setStatus] = useState(initialStatus);
  const [statusLabel, setStatusLabel] = useState(initialStatusLabel);
  const [currentError, setCurrentError] = useState<string | null>(lastError);
  const [currentIngested, setCurrentIngested] = useState(lastIngested);
  const [statusMessage, setStatusMessage] = useState(
    getStatusMessage(sourceName, initialStatus, lastIngested, lastError)
  );

  useEffect(() => {
    // Only poll if we're syncing or just started syncing
    if (!isSyncing && status !== "syncing") {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const { sources } = await fetchFundingSources();
        const source = sources.find(s => s.id === sourceId);
        
        if (source) {
          const newStatus = source.lastStatus || "never";
          const newError = source.lastError;
          const newIngested = source.lastIngested;
          
          // Update status if it changed
          if (newStatus !== status) {
            setStatus(newStatus);
            setCurrentError(newError);
            setCurrentIngested(newIngested);
            
            // Update status label
            if (newStatus === "syncing") {
              setStatusLabel("Syncing now");
            } else if (newStatus === "success") {
              setStatusLabel("Success");
            } else if (newStatus === "failed") {
              setStatusLabel("Failed");
            }
            
            // Update message
            setStatusMessage(getStatusMessage(sourceName, newStatus, newIngested, newError));
            
            // Stop polling if sync is complete (success or failed)
            if (newStatus !== "syncing") {
              clearInterval(pollInterval);
            }
          } else if (newStatus === "syncing") {
            // Still syncing, update message to show progress
            setStatusMessage(getStatusMessage(sourceName, newStatus, newIngested, newError));
          }
        }
      } catch (error) {
        logWarning(error instanceof Error ? error : String(error), { action: "pollStatus", sourceId });
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [sourceId, sourceName, status, isSyncing]);

  // Update message when isSyncing changes
  useEffect(() => {
    if (isSyncing && status === "syncing") {
      setStatusMessage(getStatusMessage(sourceName, "syncing", currentIngested, currentError));
    }
  }, [isSyncing, sourceName, status, currentIngested, currentError]);

  return (
    <div>
      <div style={{ fontSize: "13px", fontWeight: 600, color: statusColor, marginBottom: "4px" }}>
        {statusLabel}
      </div>
      {statusMessage && (
        <div 
          className="muted" 
          style={{ 
            fontSize: "11px", 
            marginTop: "4px", 
            lineHeight: "1.4",
            color: status === "syncing" ? statusColor : "var(--text-secondary)"
          }}
        >
          {statusMessage}
        </div>
      )}
      {lastSuccessfulSync && (
        <div className="muted" style={{ fontSize: "11px", marginTop: "4px", lineHeight: "1.4" }}>
          Last success: {new Date(lastSuccessfulSync).toLocaleDateString()}
        </div>
      )}
      {(ingestedLast24h > 0 || errorRate > 0) && (
        <div className="muted" style={{ fontSize: "11px", marginTop: "4px", lineHeight: "1.4" }}>
          24h ingested: {ingestedLast24h.toLocaleString()} · Error rate: {(errorRate * 100).toFixed(0)}%
        </div>
      )}
      {currentError && status === "failed" && !statusMessage.includes(currentError) && (
        <div className="muted" style={{ fontSize: "11px", marginTop: "4px", lineHeight: "1.4" }}>
          {currentError.length > 50 ? `${currentError.substring(0, 50)}...` : currentError}
        </div>
      )}
    </div>
  );
}
