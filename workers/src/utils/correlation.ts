export function getCorrelationId(request?: Request): string {
  const header = request?.headers.get("X-Correlation-ID") ?? request?.headers.get("x-correlation-id");
  return header ?? crypto.randomUUID();
}
