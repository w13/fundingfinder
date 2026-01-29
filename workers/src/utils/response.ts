import { getCorrelationId } from "./correlation";

export function jsonResponse(payload: unknown, status = 200, request?: Request, correlationId?: string): Response {
  const resolvedCorrelationId = correlationId ?? getCorrelationId(request);
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Correlation-ID",
    "X-Correlation-ID": resolvedCorrelationId
  };

  // Handle preflight OPTIONS requests
  if (request?.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  // For null payload (like OPTIONS), return empty response
  if (payload === null) {
    return new Response(null, { status, headers });
  }

  return new Response(JSON.stringify(payload), {
    status,
    headers
  });
}
