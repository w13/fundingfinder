"use client";

import { useState, useTransition } from "react";
import { useErrorLogger } from "../lib/errors/useErrorLogger";

interface AnalyzeButtonProps {
  action: (formData?: FormData) => Promise<void>;
  itemCount: number;
}

export default function AnalyzeButton({ action, itemCount }: AnalyzeButtonProps) {
  const { logError } = useErrorLogger("AnalyzeButton");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsAnalyzing(true);

    try {
      await new Promise<void>((resolve, reject) => {
        startTransition(async () => {
          try {
            await action();
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });

      // Keep loading state visible for at least 2 seconds
      setTimeout(() => {
        setIsAnalyzing(false);
      }, 2000);
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), "high", {
        action: "analyzeShortlist"
      });
      setIsAnalyzing(false);
    }
  };

  const isLoading = isAnalyzing || isPending;

  return (
    <form onSubmit={handleSubmit} style={{ margin: 0 }}>
      <button
        className="button"
        type="submit"
        disabled={isLoading || itemCount === 0}
        style={{
          position: "relative",
          overflow: "hidden",
          opacity: isLoading ? 0.8 : 1,
          cursor: isLoading || itemCount === 0 ? "not-allowed" : "pointer"
        }}
      >
        {isLoading ? (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                animation: "spin 1s linear infinite",
                marginRight: "8px",
                display: "inline-block"
              }}
            >
              <circle cx="12" cy="12" r="10" opacity="0.25" />
              <path d="M12 2 A10 10 0 0 1 22 12" opacity="0.75" />
            </svg>
            Analyzing...
          </>
        ) : (
          "Analyze Shortlist"
        )}
        {isLoading && (
          <span
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "2px",
              background: "var(--primary)",
              animation: "progress 2s ease-in-out infinite"
            }}
          />
        )}
      </button>
    </form>
  );
}
