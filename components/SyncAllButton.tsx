"use client";

import { useState, useTransition, useEffect } from "react";
import { useErrorLogger } from "../lib/errors/useErrorLogger";

interface SyncAllButtonProps {
  action: (formData?: FormData) => Promise<void>;
  activeSources?: Array<{ id: string; name: string }>;
  readOnly?: boolean;
}

// Known sources that are synced in order (matching worker/src/index.ts runSync)
const KNOWN_SYNC_SOURCES = [
  { id: "grants_gov", name: "Grants.gov" },
  { id: "sam_gov", name: "SAM.gov" },
  { id: "hrsa", name: "HRSA" },
  { id: "worldbank", name: "World Bank" },
  { id: "prozorro_ua", name: "ProZorro" },
  { id: "contracts_finder_uk", name: "Contracts Finder" },
  { id: "austender_au", name: "AusTender" }
];

export default function SyncAllButton({ action, activeSources = [], readOnly = false }: SyncAllButtonProps) {
  const { logError } = useErrorLogger("SyncAllButton");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(0);
  const [currentMessage, setCurrentMessage] = useState("");

  useEffect(() => {
    if (!isSyncing && !isPending) {
      setCurrentStep(0);
      setCurrentMessage("");
      return;
    }

    // Cycle through known sources with more descriptive actions
    const allSteps: Array<{ name: string; action: string }> = [
      { name: "Grants.gov", action: "Fetching federal grant opportunities" },
      { name: "SAM.gov", action: "Fetching contract opportunities" },
      { name: "HRSA", action: "Fetching health grants" },
      { name: "World Bank", action: "Fetching procurement notices" },
      { name: "ProZorro", action: "Fetching Ukrainian tenders" },
      { name: "Contracts Finder", action: "Fetching UK contracts" },
      { name: "AusTender", action: "Fetching Australian tenders" },
      { name: "Catalog Sources", action: "Syncing registered sources" },
      { name: "Processing", action: "Storing opportunities in database" }
    ];

    // Start with first step immediately
    if (currentStep === 0 && isSyncing) {
      setCurrentMessage(allSteps[0].action + " from " + allSteps[0].name + "...");
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next >= allSteps.length) {
          // Loop back to keep showing progress
          return 0;
        }
        return next;
      });
    }, 4000); // Change step every 4 seconds

    // Update message based on current step
    if (currentStep < allSteps.length) {
      const step = allSteps[currentStep];
      setCurrentMessage(`${step.action} from ${step.name}...`);
    }

    return () => clearInterval(interval);
  }, [isSyncing, isPending, currentStep]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (readOnly) return;
    setIsSyncing(true);
    setCurrentStep(0);
    setCurrentMessage("Starting sync...");
    
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      try {
        await action(formData);
        // Keep the loading state for at least 2 seconds to show feedback
        setTimeout(() => {
          setIsSyncing(false);
          setCurrentStep(0);
          setCurrentMessage("");
        }, 2000);
      } catch (error) {
        logError(error instanceof Error ? error : new Error(String(error)), "high", {
          action: "syncAll"
        });
        setIsSyncing(false);
        setCurrentStep(0);
        setCurrentMessage("");
      }
    });
  };

  const isLoading = isSyncing || isPending;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
      <form action={action} onSubmit={handleSubmit} style={{ margin: 0 }}>
        <button
          className="button"
          type="submit"
          disabled={isLoading || readOnly}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            opacity: isLoading ? 0.7 : 1,
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            position: "relative",
            overflow: "hidden"
          }}
          title={isLoading ? "Syncing all sources..." : "Sync all sources"}
        >
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
              animation: isLoading ? "spin 1s linear infinite" : "none",
              transition: "transform 0.2s ease"
            }}
          >
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
          {isLoading ? "Syncing..." : readOnly ? "Read-only" : "Sync All Sources"}
          {isLoading && (
            <span
              style={{
                position: "absolute",
                bottom: "0",
                left: "0",
                height: "2px",
                background: "var(--primary)",
                width: "100%",
                animation: "progress 2s ease-in-out infinite",
                borderRadius: "0"
              }}
            />
          )}
        </button>
      </form>
      {isLoading && currentMessage && (
        <div
          style={{
            fontSize: "12px",
            color: "var(--text-secondary)",
            textAlign: "right",
            padding: "4px 8px",
            background: "var(--background-secondary)",
            borderRadius: "0",
            minWidth: "200px",
            animation: "fadeIn 0.3s ease-in"
          }}
        >
          {currentMessage}
        </div>
      )}
    </div>
  );
}
