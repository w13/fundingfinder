import type {
  SectionSlices,
  ShortlistAnalysisCandidate,
  ShortlistItem,
  SourceSystem
} from "../types";
import { safeJsonParse } from "../utils";

export interface ShortlistItem {
  shortlistId: string;
  opportunityRecordId: string;
  opportunityId: string;
  source: SourceSystem;
  title: string;
  agency: string | null;
  summary: string | null;
  postedDate: string | null;
  dueDate: string | null;
  feasibilityScore: number | null;
  suitabilityScore: number | null;
  profitabilityScore: number | null;
  analysisSummary: string[];
  constraints: string[];
  analyzed: boolean;
}

export interface ShortlistAnalysisCandidate {
  shortlistId: string;
  opportunityId: string;
  source: SourceSystem;
  title: string;
  summary: string | null;
  eligibility: string | null;
  textExcerpt: string | null;
  sectionMap: SectionSlices | null;
}

export async function listShortlist(db: D1Database): Promise<ShortlistItem[]> {
  const results = await db
    .prepare(
      `WITH LatestAnalyses AS (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY opportunity_id, source ORDER BY created_at DESC) as rn
        FROM analyses
      )
      SELECT
        s.id as shortlistId,
        o.id as opportunityRecordId,
        o.opportunity_id as opportunityId,
        o.source,
        o.title,
        o.agency,
        o.summary,
        o.posted_date as postedDate,
        o.due_date as dueDate,
        a.feasibility_score as feasibilityScore,
        a.suitability_score as suitabilityScore,
        a.profitability_score as profitabilityScore,
        a.summary as analysisSummary,
        a.constraints as analysisConstraints,
        a.created_at as analysisCreatedAt
      FROM shortlist s
      JOIN opportunities o ON o.opportunity_id = s.opportunity_id AND o.source = s.source
      LEFT JOIN LatestAnalyses a
        ON a.opportunity_id = o.opportunity_id
        AND a.source = o.source
        AND a.rn = 1
      ORDER BY s.created_at DESC`
    )
    .all<{
      shortlistId: string;
      opportunityRecordId: string;
      opportunityId: string;
      source: SourceSystem;
      title: string;
      agency: string | null;
      summary: string | null;
      postedDate: string | null;
      dueDate: string | null;
      feasibilityScore: number | null;
      suitabilityScore: number | null;
      profitabilityScore: number | null;
      analysisSummary: string | null;
      analysisConstraints: string | null;
      analysisCreatedAt: string | null;
    }>();

  return (
    results.results?.map((row) => ({
      shortlistId: row.shortlistId,
      opportunityRecordId: row.opportunityRecordId,
      opportunityId: row.opportunityId,
      source: row.source,
      title: row.title,
      agency: row.agency,
      summary: row.summary,
      postedDate: row.postedDate,
      dueDate: row.dueDate,
      feasibilityScore: row.feasibilityScore,
      suitabilityScore: row.suitabilityScore,
      profitabilityScore: row.profitabilityScore,
      analysisSummary: safeJsonParse<string[]>(row.analysisSummary) ?? [],
      constraints: safeJsonParse<string[]>(row.analysisConstraints) ?? [],
      analyzed: row.analysisCreatedAt !== null
    })) ?? []
  );
}

export async function addShortlist(db: D1Database, opportunityId: string, source: SourceSystem): Promise<{ id: string; created: boolean }> {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await db
    .prepare("INSERT OR IGNORE INTO shortlist (id, opportunity_id, source, created_at) VALUES (?, ?, ?, ?)")
    .bind(id, opportunityId, source, createdAt)
    .run();

  const existing = await db
    .prepare("SELECT id FROM shortlist WHERE opportunity_id = ? AND source = ?")
    .bind(opportunityId, source)
    .first<{ id: string }>();

  return { id: existing?.id ?? id, created: existing?.id === id };
}

export async function removeShortlist(db: D1Database, shortlistId: string): Promise<boolean> {
  const result = await db.prepare("DELETE FROM shortlist WHERE id = ?").bind(shortlistId).run();
  return Boolean(result.meta?.changes);
}

export async function removeShortlistByOpportunity(
  db: D1Database,
  opportunityId: string,
  source: SourceSystem
): Promise<boolean> {
  const result = await db
    .prepare("DELETE FROM shortlist WHERE opportunity_id = ? AND source = ?")
    .bind(opportunityId, source)
    .run();
  return Boolean(result.meta?.changes);
}

export async function listShortlistForAnalysis(
  db: D1Database,
  shortlistIds?: string[]
): Promise<ShortlistAnalysisCandidate[]> {
  const hasIds = Array.isArray(shortlistIds) && shortlistIds.length > 0;
  const placeholders = hasIds ? shortlistIds.map(() => "?").join(",") : "";
  const whereClause = hasIds ? `WHERE s.id IN (${placeholders})` : "";

  const statement = `
    WITH LatestDocuments AS (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY opportunity_id, source ORDER BY created_at DESC) as rn
      FROM documents
    )
    SELECT
      s.id as shortlistId,
      o.opportunity_id as opportunityId,
      o.source,
      o.title,
      o.summary,
      o.eligibility,
      d.text_excerpt as textExcerpt,
      d.section_map as sectionMap
    FROM shortlist s
    JOIN opportunities o ON o.opportunity_id = s.opportunity_id AND o.source = s.source
    LEFT JOIN LatestDocuments d
      ON d.opportunity_id = o.opportunity_id
      AND d.source = o.source
      AND d.rn = 1
    ${whereClause}
    ORDER BY s.created_at DESC
  `;

  const results = await db
    .prepare(statement)
    .bind(...(hasIds ? shortlistIds : []))
    .all<{
      shortlistId: string;
      opportunityId: string;
      source: SourceSystem;
      title: string;
      summary: string | null;
      eligibility: string | null;
      textExcerpt: string | null;
      sectionMap: string | null;
    }>();

  return (
    results.results?.map((row) => ({
      shortlistId: row.shortlistId,
      opportunityId: row.opportunityId,
      source: row.source,
      title: row.title,
      summary: row.summary,
      eligibility: row.eligibility,
      textExcerpt: row.textExcerpt,
      sectionMap: safeJsonParse<SectionSlices>(row.sectionMap)
    })) ?? []
  );
}
