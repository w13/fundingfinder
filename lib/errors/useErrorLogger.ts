"use client";

import { useCallback } from "react";
import { errorLogger, type ErrorSeverity } from "./errorLogger";

/**
 * React hook for easy error logging in components
 */
export function useErrorLogger(componentName?: string) {
  const logError = useCallback(
    (error: Error | string, severity: ErrorSeverity = "medium", context?: Record<string, unknown>, metadata?: Record<string, unknown>) => {
      return errorLogger.log(error, severity, {
        component: componentName || "Unknown",
        ...context
      }, metadata);
    },
    [componentName]
  );

  const logInfo = useCallback(
    (message: string, context?: Record<string, unknown>) => {
      return errorLogger.log(message, "low", {
        component: componentName || "Unknown",
        ...context
      });
    },
    [componentName]
  );

  const logWarning = useCallback(
    (error: Error | string, context?: Record<string, unknown>) => {
      return errorLogger.log(error, "medium", {
        component: componentName || "Unknown",
        ...context
      });
    },
    [componentName]
  );

  const logCritical = useCallback(
    (error: Error | string, context?: Record<string, unknown>, metadata?: Record<string, unknown>) => {
      return errorLogger.log(error, "critical", {
        component: componentName || "Unknown",
        ...context
      }, metadata);
    },
    [componentName]
  );

  return {
    logError,
    logInfo,
    logWarning,
    logCritical,
    getRecentLogs: errorLogger.getRecentLogs.bind(errorLogger),
    getStats: errorLogger.getStats.bind(errorLogger)
  };
}

