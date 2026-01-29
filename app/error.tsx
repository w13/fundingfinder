"use client";

import { useEffect, useState } from "react";
import { errorLogger } from "../lib/errors/errorLogger";
import Link from "next/link";

export default function Error({
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

    // Log the error with full details
    errorLogger.log(error, "critical", {
      component: "ErrorPage",
      action: "page-error",
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
    <div style={{ padding: "48px 24px", textAlign: "center" }}>
      <div className="card" style={{ maxWidth: "800px", margin: "0 auto", textAlign: "left" }}>
        <h2 style={{ margin: 0, marginBottom: "16px", color: "var(--error)", fontSize: "24px" }}>
          Something went wrong!
        </h2>
        <p style={{ margin: 0, marginBottom: "24px", color: "var(--text-secondary)", fontSize: "15px" }}>
          An unexpected error occurred. The error has been logged with full details to the server console.
        </p>
        <div style={{ 
          padding: "12px 16px", 
          background: "#eff6ff", 
          border: "1px solid #bfdbfe", 
          borderRadius: "0", 
          marginBottom: "24px",
          fontSize: "13px",
          color: "#1e40af"
        }}>
          <strong>To view the actual error details:</strong>
          <ul style={{ margin: "8px 0 0 20px", padding: 0 }}>
            <li>Check Cloudflare Workers logs: <code style={{ background: "#dbeafe", padding: "2px 4px" }}>wrangler tail grant-sentinel-frontend</code></li>
            <li>Or view logs in the Cloudflare Dashboard under Workers &gt; grant-sentinel-frontend &gt; Logs</li>
            <li>Look for entries prefixed with <code style={{ background: "#dbeafe", padding: "2px 4px" }}>[SERVER ERROR]</code></li>
          </ul>
        </div>

        <div
          style={{
            padding: "12px 16px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "0",
            marginBottom: "24px"
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: "8px", color: "#991b1b", fontSize: "13px" }}>
            Error Details:
          </div>
          <div style={{ fontFamily: "monospace", fontSize: "12px", color: "#7f1d1d", marginBottom: "8px" }}>
            <div><strong>Type:</strong> {error.name || "Error"}</div>
            <div><strong>Message:</strong> {error.message || "No message available"}</div>
            {error.digest && (
              <div><strong>Error ID:</strong> {error.digest}</div>
            )}
          </div>

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
                {showDetails ? "Hide" : "Show"} Full Error Details
              </button>
              {showDetails && (
                <div style={{ marginTop: "8px" }}>
                  <div style={{ fontWeight: 600, marginBottom: "4px", fontSize: "11px" }}>Stack Trace:</div>
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
                </div>
              )}
            </div>
          )}

          {errorDetails && (
            <div style={{ marginTop: "12px" }}>
              <button
                onClick={() => {
                  const detailsDiv = document.getElementById("error-json-details");
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
                id="error-json-details"
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

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <button className="button" onClick={reset} style={{ fontSize: "14px" }}>
            Try again
          </button>
          <Link href="/" className="button button--secondary" style={{ fontSize: "14px", textDecoration: "none" }}>
            Go to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
