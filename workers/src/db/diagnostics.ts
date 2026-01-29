import type { NormalizationDiagnostics, NormalizationDiagnosticsSummary } from "../types";

export async function insertNormalizationDiagnostics(
  db: D1Database,
  payload: {
    opportunityId: string;
    source: string;
    diagnostics: NormalizationDiagnostics;
  }
): Promise<void> {
  if (payload.diagnostics.missingFields.length === 0 && payload.diagnostics.guessedFields.length === 0) {
    return;
  }

  await db
    .prepare(
      `INSERT INTO normalization_diagnostics (
        id, opportunity_id, source, missing_fields, guessed_fields, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(
      crypto.randomUUID(),
      payload.opportunityId,
      payload.source,
      JSON.stringify(payload.diagnostics.missingFields),
      JSON.stringify(payload.diagnostics.guessedFields),
      new Date().toISOString()
    )
    .run();
}

export async function getNormalizationDiagnosticsSummary(db: D1Database): Promise<NormalizationDiagnosticsSummary[]> {
  const results = await db
    .prepare(
      `SELECT
        source,
        missing_fields as missingFields,
        guessed_fields as guessedFields,
        created_at as createdAt
      FROM normalization_diagnostics`
    )
    .all<{ source: string; missingFields: string; guessedFields: string; createdAt: string }>();

  const summaries = new Map<string, NormalizationDiagnosticsSummary>();

  for (const row of results.results ?? []) {
    const existing = summaries.get(row.source) ?? {
      source: row.source,
      missingCounts: {},
      guessedCounts: {},
      lastSeenAt: null
    };

    const missing = safeParseArray(row.missingFields);
    const guessed = safeParseArray(row.guessedFields);

    for (const field of missing) {
      existing.missingCounts[field] = (existing.missingCounts[field] ?? 0) + 1;
    }
    for (const field of guessed) {
      existing.guessedCounts[field] = (existing.guessedCounts[field] ?? 0) + 1;
    }

    if (!existing.lastSeenAt || row.createdAt > existing.lastSeenAt) {
      existing.lastSeenAt = row.createdAt;
    }

    summaries.set(row.source, existing);
  }

  return Array.from(summaries.values());
}

function safeParseArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}
