"use client";

import { useEffect, useState } from "react";
import { errorLogger } from "../lib/errors/errorLogger";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string; cause?: unknown };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>("");

  useEffect(() => {
    // Extract all possible error information
    const details: Record<string, unknown> = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      cause: error.cause,
      // Try to extract any additional properties
      ...Object.fromEntries(
        Object.entries(error).filter(([key]) => !["name", "message", "stack", "digest", "cause"].includes(key))
      )
    };

    // Log critical global errors with full details
    errorLogger.log(error, "critical", {
      component: "GlobalError",
      action: "global-error",
      digest: error.digest,
      url: typeof window !== "undefined" ? window.location.href : undefined
    }, details);

    // Format error details for display
    try {
      setErrorDetails(JSON.stringify(details, null, 2));
    } catch {
      setErrorDetails(String(error));
    }
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div style={{ 
          minHeight: "100vh", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          padding: "24px",
          background: "var(--bg)"
        }}>
          <div style={{ 
            maxWidth: "600px", 
            width: "100%",
            background: "#fff",
            border: "1px solid var(--border)",
            borderRadius: "0",
            padding: "48px 32px",
            boxShadow: "var(--shadow-lg)"
          }}>
            <h1 style={{ margin: 0, marginBottom: "16px", color: "var(--error)", fontSize: "28px" }}>
              Application Error
            </h1>
            <p style={{ margin: 0, marginBottom: "24px", color: "var(--text-secondary)", fontSize: "15px", lineHeight: "1.6" }}>
              A critical error occurred that prevented the application from loading. 
              The error has been logged and our team will investigate.
            </p>

            <div
              style={{
                padding: "16px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "0",
                marginBottom: "24px",
                fontFamily: "monospace",
                fontSize: "12px",
                color: "#7f1d1d"
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: "8px" }}>
                {error.name || "Error"}: {error.message || "An error occurred"}
              </div>
              {error.digest && (
                <div style={{ marginBottom: "8px", fontSize: "11px" }}>
                  <strong>Error ID:</strong> {error.digest}
                </div>
              )}
              
              {error.stack && (
                <div style={{ marginTop: "12px" }}>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    style={{
                      background: "transparent",
                      border: "1px solid #fecaca",
                      color: "#991b1b",
                      padding: "4px 8px",
                      fontSize: "11px",
                      cursor: "pointer",
                      marginBottom: "8px"
                    }}
                  >
                    {showDetails ? "Hide" : "Show"} Stack Trace
                  </button>
                  {showDetails && (
                    <pre style={{ 
                      margin: 0, 
                      padding: "8px", 
                      background: "#fee2e2", 
                      fontSize: "11px", 
                      overflow: "auto",
                      maxHeight: "300px",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word"
                    }}>
                      {error.stack}
                    </pre>
                  )}
                </div>
              )}

              {errorDetails && (
                <div style={{ marginTop: "12px" }}>
                  <button
                    onClick={() => {
                      const detailsDiv = document.getElementById("global-error-json-details");
                      if (detailsDiv) {
                        detailsDiv.style.display = detailsDiv.style.display === "none" ? "block" : "none";
                      }
                    }}
                    style={{
                      background: "transparent",
                      border: "1px solid #fecaca",
                      color: "#991b1b",
                      padding: "4px 8px",
                      fontSize: "11px",
                      cursor: "pointer",
                      marginBottom: "8px"
                    }}
                  >
                    Show Raw Error Data
                  </button>
                  <pre
                    id="global-error-json-details"
                    style={{
                      display: "none",
                      margin: 0,
                      padding: "8px",
                      background: "#fee2e2",
                      fontSize: "11px",
                      overflow: "auto",
                      maxHeight: "300px",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word"
                    }}
                  >
                    {errorDetails}
                  </pre>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button 
                className="button" 
                onClick={reset}
                style={{ fontSize: "14px" }}
              >
                Try again
              </button>
              <button 
                className="button button--secondary" 
                onClick={() => window.location.href = "/"}
                style={{ fontSize: "14px" }}
              >
                Go to homepage
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
