/**
 * Server-side error logger
 * Logs errors on the server before Next.js sanitizes them
 */

export function logServerError(
  error: unknown,
  context: {
    component?: string;
    action?: string;
    url?: string;
    [key: string]: unknown;
  } = {}
): void {
  const errorDetails = {
    name: error instanceof Error ? error.name : "Unknown",
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    cause: error instanceof Error ? error.cause : undefined,
    // Extract all properties from the error
    ...(error instanceof Error
      ? Object.fromEntries(
          Object.entries(error).filter(([key]) => !["name", "message", "stack", "cause"].includes(key))
        )
      : {}),
    context,
    timestamp: new Date().toISOString()
  };

  // Log to console (will appear in Cloudflare Workers logs)
  console.error("[SERVER ERROR]", JSON.stringify(errorDetails, null, 2));

  // Also log the error object directly for stack traces
  if (error instanceof Error) {
    console.error("[SERVER ERROR STACK]", error.stack);
  }
}

