let cachedCorrelationId: string | null = null;

export function getCorrelationId(): string {
  if (typeof window === "undefined") {
    return crypto.randomUUID();
  }

  if (cachedCorrelationId) return cachedCorrelationId;

  try {
    const stored = window.sessionStorage.getItem("gs-correlation-id");
    if (stored) {
      cachedCorrelationId = stored;
      return stored;
    }
  } catch {
    // Ignore storage access errors
  }

  const id = crypto.randomUUID();
  try {
    window.sessionStorage.setItem("gs-correlation-id", id);
  } catch {
    // Ignore storage access errors
  }
  cachedCorrelationId = id;
  return id;
}

export function getCorrelationHeaders(): HeadersInit {
  return { "X-Correlation-ID": getCorrelationId() };
}
