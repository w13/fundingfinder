export function toString(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  if (typeof value === "number") {
    return String(value);
  }
  return null;
}

export function toNullableString(value: unknown): string | null {
  return toString(value);
}

export function extractItems(data: unknown): unknown[] {
  if (!data || typeof data !== "object") return [];
  const rec = data as Record<string, unknown>;

  // Common keys for lists of items in APIs
  const candidates = [
    rec.opportunities,
    rec.oppHits,
    rec.grants,
    rec.results,
    rec.notices,
    rec.items,
    rec.records,
    rec.data
  ];

  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }

  // Nested structures
  if (rec.data && typeof rec.data === "object") {
    const nested = rec.data as Record<string, unknown>;
    const nestedCandidates = [nested.opportunities, nested.results, nested.items];
    for (const nc of nestedCandidates) {
      if (Array.isArray(nc)) return nc;
    }
  }

  return [];
}
