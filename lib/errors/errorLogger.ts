/**
 * Global Error Logging System
 * Handles error reporting, logging, and tracking across the application
 */

export type ErrorSeverity = "low" | "medium" | "high" | "critical";

export interface ErrorLog {
  id: string;
  timestamp: string;
  message: string;
  error: Error | string;
  severity: ErrorSeverity;
  context?: {
    url?: string;
    userAgent?: string;
    userId?: string;
    component?: string;
    action?: string;
    [key: string]: unknown;
  };
  stack?: string;
  metadata?: Record<string, unknown>;
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 100; // Keep last 100 errors in memory
  private listeners: Array<(log: ErrorLog) => void> = [];

  /**
   * Log an error with context
   */
  log(
    error: Error | string,
    severity: ErrorSeverity = "medium",
    context?: ErrorLog["context"],
    metadata?: Record<string, unknown>
  ): string {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;

    const log: ErrorLog = {
      id: errorId,
      timestamp: new Date().toISOString(),
      message: errorMessage,
      error: error instanceof Error ? error.message : error,
      severity,
      context: {
        url: typeof window !== "undefined" ? window.location.href : undefined,
        userAgent: typeof window !== "undefined" ? window.navigator.userAgent : undefined,
        ...context
      },
      stack: errorStack,
      metadata
    };

    // Add to in-memory logs
    this.logs.push(log);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console logging based on severity
    this.logToConsole(log);

    // Notify listeners
    this.notifyListeners(log);

    // Optionally send to external service
    this.sendToExternalService(log).catch((err) => {
      console.warn("Failed to send error to external service:", err);
    });

    return errorId;
  }

  /**
   * Log to console with appropriate level
   */
  private logToConsole(log: ErrorLog): void {
    const prefix = `[${log.severity.toUpperCase()}] ${log.timestamp}`;
    const contextStr = log.context ? `\nContext: ${JSON.stringify(log.context, null, 2)}` : "";
    const metadataStr = log.metadata ? `\nMetadata: ${JSON.stringify(log.metadata, null, 2)}` : "";
    const stackStr = log.stack ? `\nStack: ${log.stack}` : "";

    switch (log.severity) {
      case "critical":
      case "high":
        console.error(`${prefix} ${log.message}${stackStr}${contextStr}${metadataStr}`);
        // Also log to stderr in server environments
        if (typeof process !== "undefined" && process.stderr) {
          process.stderr.write(`${prefix} ${log.message}${stackStr}${contextStr}${metadataStr}\n`);
        }
        break;
      case "medium":
        console.warn(`${prefix} ${log.message}${contextStr}${metadataStr}`);
        break;
      case "low":
        console.info(`${prefix} ${log.message}${contextStr}`);
        break;
    }
  }

  /**
   * Send error to external service (API endpoint)
   */
  private async sendToExternalService(log: ErrorLog): Promise<void> {
    // Only send high/critical errors to external service
    if (log.severity !== "high" && log.severity !== "critical") {
      return;
    }

    // Only run in browser environment
    if (typeof window === "undefined") {
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_ERROR_REPORTING_API_URL;
    if (!apiUrl) {
      return; // No external service configured
    }

    try {
      await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(log),
        // Don't wait for response to avoid blocking
        keepalive: true
      });
    } catch (err) {
      // Silently fail - we don't want error reporting to cause errors
      console.warn("Error reporting service unavailable:", err);
    }
  }

  /**
   * Subscribe to error logs
   */
  subscribe(listener: (log: ErrorLog) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(log: ErrorLog): void {
    this.listeners.forEach((listener) => {
      try {
        listener(log);
      } catch (err) {
        console.warn("Error in error log listener:", err);
      }
    });
  }

  /**
   * Get recent error logs
   */
  getRecentLogs(limit = 10): ErrorLog[] {
    return this.logs.slice(-limit).reverse();
  }

  /**
   * Get all error logs
   */
  getAllLogs(): ErrorLog[] {
    return [...this.logs].reverse();
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Get error statistics
   */
  getStats(): {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    recent: ErrorLog[];
  } {
    const bySeverity: Record<ErrorSeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    this.logs.forEach((log) => {
      bySeverity[log.severity]++;
    });

    return {
      total: this.logs.length,
      bySeverity,
      recent: this.getRecentLogs(5)
    };
  }
}

// Singleton instance
export const errorLogger = new ErrorLogger();

// Global error handlers
if (typeof window !== "undefined") {
  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    errorLogger.log(error, "high", {
      action: "unhandledrejection",
      component: "global"
    });
  });

  // Handle uncaught errors
  window.addEventListener("error", (event) => {
    const error = event.error || new Error(event.message || "Unknown error");
    errorLogger.log(error, "high", {
      action: "uncaught",
      component: "global",
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });
}

