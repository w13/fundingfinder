"use client";

import React, { Component, ReactNode } from "react";
import { errorLogger, type ErrorSeverity } from "../lib/errors/errorLogger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  severity?: ErrorSeverity;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error
    const severity = this.props.severity || "high";
    errorLogger.log(error, severity, {
      component: "ErrorBoundary",
      action: "componentDidCatch",
      componentStack: errorInfo.componentStack
    }, {
      componentStack: errorInfo.componentStack
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Update state with error info
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            padding: "24px",
            background: "#fff",
            border: "1px solid var(--border)",
            borderRadius: "0",
            margin: "24px 0"
          }}
        >
          <div style={{ marginBottom: "16px" }}>
            <h3 style={{ margin: 0, marginBottom: "8px", color: "var(--error)", fontSize: "18px" }}>
              Something went wrong
            </h3>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "14px" }}>
              An error occurred while rendering this component.
            </p>
          </div>

          {this.state.error && (
            <div
              style={{
                padding: "12px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "0",
                marginBottom: "16px",
                fontFamily: "monospace",
                fontSize: "12px",
                overflow: "auto",
                maxHeight: "200px"
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: "4px", color: "#991b1b" }}>
                {this.state.error.name}: {this.state.error.message}
              </div>
              {this.state.error.stack && (
                <pre style={{ margin: 0, whiteSpace: "pre-wrap", color: "#7f1d1d" }}>
                  {this.state.error.stack}
                </pre>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="button"
              onClick={this.handleReset}
              style={{ fontSize: "13px" }}
            >
              Try again
            </button>
            <button
              className="button button--secondary"
              onClick={() => window.location.reload()}
              style={{ fontSize: "13px" }}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
