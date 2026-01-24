"use client";

import { useState, useTransition } from "react";

interface SourceRowActionsProps {
  sourceId: string;
  active: boolean;
  syncAction: (formData: FormData) => Promise<void>;
  toggleAction: (formData: FormData) => Promise<void>;
}

export default function SourceRowActions({
  sourceId,
  active,
  syncAction,
  toggleAction
}: SourceRowActionsProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isToggling, startToggleTransition] = useTransition();

  const handleSync = (e: React.FormEvent<HTMLFormElement>) => {
    setIsSyncing(true);
    // Keep disabled for a bit to show feedback, then re-enable
    setTimeout(() => setIsSyncing(false), 3000);
    // Let the form submit naturally - the server action will handle it
  };

  const handleToggle = (e: React.FormEvent<HTMLFormElement>) => {
    startToggleTransition(() => {
      // Form will submit naturally - the server action will handle it
    });
  };

  return (
    <div style={{ display: "flex", gap: "8px", justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
      <form action={syncAction} onSubmit={handleSync} style={{ margin: 0 }}>
        <input type="hidden" name="sourceId" value={sourceId} />
        <button
          className="button"
          type="submit"
          disabled={isSyncing}
          style={{
            padding: "6px 12px",
            fontSize: "12px",
            whiteSpace: "nowrap",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            opacity: isSyncing ? 0.6 : 1,
            cursor: isSyncing ? "not-allowed" : "pointer",
            transition: "opacity 0.2s ease"
          }}
          title="Sync this source now"
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
              animation: isSyncing ? "spin 1s linear infinite" : "none"
            }}
          >
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
          {isSyncing ? "Syncing..." : "Sync"}
        </button>
      </form>
      <form action={toggleAction} onSubmit={handleToggle} style={{ margin: 0, display: "inline-block" }}>
        <input type="hidden" name="sourceId" value={sourceId} />
        <input type="hidden" name="active" value={active ? "false" : "true"} />
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
            color: active ? "var(--primary)" : "var(--muted)",
            borderRadius: "6px",
            transition: "all 0.2s ease",
            opacity: isToggling ? 0.6 : 1
          }}
          title={active ? "Disable source" : "Enable source"}
        >
          <span
            style={{
              display: "inline-block",
              width: "44px",
              height: "24px",
              borderRadius: "12px",
              backgroundColor: active ? "var(--primary)" : "#cbd5e1",
              position: "relative",
              transition: "background-color 0.2s ease"
            }}
          >
            <span
              style={{
                position: "absolute",
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                background: "white",
                top: "3px",
                left: active ? "23px" : "3px",
                transition: "left 0.2s ease",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
              }}
            />
          </span>
          <span>{active ? "On" : "Off"}</span>
        </button>
      </form>
    </div>
  );
}
