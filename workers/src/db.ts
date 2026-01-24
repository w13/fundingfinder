import type { AdminSummary, AnalysisResult, ExclusionRule, ExclusionRuleType, OpportunityRecord, SectionSlices, SourceSystem } from "./types";
import { safeJsonParse } from "./utils";

export interface OpportunityQuery {
  query?: string;
  source?: SourceSystem;
  minScore?: number;
  limit?: number;
}

export interface OpportunityListItem {
  id: string;
  opportunityId: string;
  source: SourceSystem;
  title: string;
  agency: string | null;
  status: string | null;
  summary: string | null;
  postedDate: string | null;
  dueDate: string | null;
  keywordScore: number;
  feasibilityScore: number | null;
  profitabilityScore: number | null;
}

export interface OpportunityDetail extends OpportunityListItem {
  eligibility: string | null;
  url: string | null;
  forProfitEligible: boolean;
  smallBusinessEligible: boolean;
  analysisSummary: string[];
  constraints: string[];
  documents: Array<{
    id: string;
    documentUrl: string;
    r2Key: string;
    sectionMap: SectionSlices | null;
  }>;
}

export async function upsertOpportunity(db: D1Database, record: OpportunityRecord): Promise<{ id: string; version: number; updated: boolean }> {
  const existing = await db
    .prepare("SELECT id, version, version_hash FROM opportunities WHERE opportunity_id = ? AND source = ?")
    .bind(record.opportunityId, record.source)
    .first<{ id: string; version: number; version_hash: string }>();

  const now = new Date().toISOString();
  if (!existing) {
    await db
      .prepare(
        `INSERT INTO opportunities (
          id, opportunity_id, source, title, agency, bureau, status, summary, eligibility,
          for_profit_eligible, small_business_eligible, keyword_score, posted_date, due_date,
          url, version, version_hash, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        record.id,
        record.opportunityId,
        record.source,
        record.title,
        record.agency,
        record.bureau,
        record.status,
        record.summary,
        record.eligibility,
        record.forProfitEligible ? 1 : 0,
        record.smallBusinessEligible ? 1 : 0,
        record.keywordScore,
        record.postedDate,
        record.dueDate,
        record.url,
        record.version,
        record.versionHash,
        now,
        now
      )
      .run();

    await insertOpportunityVersion(db, record, record.version, now);
    return { id: record.id, version: record.version, updated: true };
  }

  if (existing.version_hash !== record.versionHash) {
    const nextVersion = existing.version + 1;
    await db
      .prepare(
        `UPDATE opportunities SET
          title = ?, agency = ?, bureau = ?, status = ?, summary = ?, eligibility = ?,
          for_profit_eligible = ?, small_business_eligible = ?, keyword_score = ?,
          posted_date = ?, due_date = ?, url = ?, version = ?, version_hash = ?, updated_at = ?
        WHERE id = ?`
      )
      .bind(
        record.title,
        record.agency,
        record.bureau,
        record.status,
        record.summary,
        record.eligibility,
        record.forProfitEligible ? 1 : 0,
        record.smallBusinessEligible ? 1 : 0,
        record.keywordScore,
        record.postedDate,
        record.dueDate,
        record.url,
        nextVersion,
        record.versionHash,
        now,
        existing.id
      )
      .run();

    await insertOpportunityVersion(db, record, nextVersion, now);
    return { id: existing.id, version: nextVersion, updated: true };
  }

  await db.prepare("UPDATE opportunities SET updated_at = ? WHERE id = ?").bind(now, existing.id).run();
  return { id: existing.id, version: existing.version, updated: false };
}

async function insertOpportunityVersion(db: D1Database, record: OpportunityRecord, version: number, timestamp: string): Promise<void> {
  await db
    .prepare(
      `INSERT INTO opportunity_versions (
        id, opportunity_id, source, version, payload, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(crypto.randomUUID(), record.opportunityId, record.source, version, JSON.stringify(record.rawPayload), timestamp)
    .run();
}

export async function listOpportunities(db: D1Database, query: OpportunityQuery): Promise<OpportunityListItem[]> {
  const conditions: string[] = [];
  const params: Array<string | number> = [];

  if (query.query) {
    conditions.push("(lower(o.title) LIKE ? OR lower(o.summary) LIKE ? OR lower(o.agency) LIKE ?)");
    const like = `%${query.query.toLowerCase()}%`;
    params.push(like, like, like);
  }

  if (query.source) {
    conditions.push("o.source = ?");
    params.push(query.source);
  }

  if (typeof query.minScore === "number") {
    conditions.push("a.feasibility_score >= ?");
    params.push(query.minScore);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = query.limit ?? 50;

  const statement = `
    SELECT
      o.id,
      o.opportunity_id as opportunityId,
      o.source,
      o.title,
      o.agency,
      o.status,
      o.summary,
      o.posted_date as postedDate,
      o.due_date as dueDate,
      o.keyword_score as keywordScore,
      a.feasibility_score as feasibilityScore,
      a.profitability_score as profitabilityScore
    FROM opportunities o
    LEFT JOIN analyses a
      ON a.opportunity_id = o.opportunity_id
      AND a.source = o.source
      AND a.created_at = (
        SELECT MAX(created_at) FROM analyses
        WHERE opportunity_id = o.opportunity_id AND source = o.source
      )
    ${whereClause}
    ORDER BY (a.feasibility_score IS NULL) ASC, a.feasibility_score DESC, o.posted_date DESC
    LIMIT ?
  `;

  const results = await db.prepare(statement).bind(...params, limit).all<OpportunityListItem>();
  return results.results ?? [];
}

export async function getOpportunityById(db: D1Database, id: string): Promise<OpportunityDetail | null> {
  const row = await db
    .prepare(
      `SELECT
        o.id,
        o.opportunity_id as opportunityId,
        o.source,
        o.title,
        o.agency,
        o.status,
        o.summary,
        o.eligibility,
        o.for_profit_eligible as forProfitEligible,
        o.small_business_eligible as smallBusinessEligible,
        o.keyword_score as keywordScore,
        o.posted_date as postedDate,
        o.due_date as dueDate,
        o.url,
        a.feasibility_score as feasibilityScore,
        a.profitability_score as profitabilityScore,
        a.summary as analysisSummary,
        a.constraints as constraints
      FROM opportunities o
      LEFT JOIN analyses a
        ON a.opportunity_id = o.opportunity_id
        AND a.source = o.source
        AND a.created_at = (
          SELECT MAX(created_at) FROM analyses
          WHERE opportunity_id = o.opportunity_id AND source = o.source
        )
      WHERE o.id = ?`
    )
    .bind(id)
    .first<{
      id: string;
      opportunityId: string;
      source: SourceSystem;
      title: string;
      agency: string | null;
      status: string | null;
      summary: string | null;
      eligibility: string | null;
      forProfitEligible: number;
      smallBusinessEligible: number;
      keywordScore: number;
      postedDate: string | null;
      dueDate: string | null;
      url: string | null;
      feasibilityScore: number | null;
      profitabilityScore: number | null;
      analysisSummary: string | null;
      constraints: string | null;
    }>();

  if (!row) return null;

  const documents = await db
    .prepare(
      `SELECT id, document_url as documentUrl, r2_key as r2Key, section_map as sectionMap
       FROM documents
       WHERE opportunity_id = ? AND source = ?`
    )
    .bind(row.opportunityId, row.source)
    .all<{ id: string; documentUrl: string; r2Key: string; sectionMap: string | null }>();

  return {
    id: row.id,
    opportunityId: row.opportunityId,
    source: row.source,
    title: row.title,
    agency: row.agency,
    status: row.status,
    summary: row.summary,
    eligibility: row.eligibility,
    forProfitEligible: row.forProfitEligible === 1,
    smallBusinessEligible: row.smallBusinessEligible === 1,
    keywordScore: row.keywordScore,
    postedDate: row.postedDate,
    dueDate: row.dueDate,
    url: row.url,
    feasibilityScore: row.feasibilityScore,
    profitabilityScore: row.profitabilityScore,
    analysisSummary: safeJsonParse<string[]>(row.analysisSummary) ?? [],
    constraints: safeJsonParse<string[]>(row.constraints) ?? [],
    documents: (documents.results ?? []).map((doc) => ({
      id: doc.id,
      documentUrl: doc.documentUrl,
      r2Key: doc.r2Key,
      sectionMap: safeJsonParse<SectionSlices>(doc.sectionMap)
    }))
  };
}

export async function insertDocument(
  db: D1Database,
  opportunityId: string,
  source: SourceSystem,
  documentUrl: string,
  r2Key: string,
  textExcerpt: string,
  sectionMap: SectionSlices
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO documents (
        id, opportunity_id, source, document_url, r2_key, text_excerpt, section_map, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      crypto.randomUUID(),
      opportunityId,
      source,
      documentUrl,
      r2Key,
      textExcerpt,
      JSON.stringify(sectionMap),
      new Date().toISOString()
    )
    .run();
}

export async function insertAnalysis(db: D1Database, opportunityId: string, source: SourceSystem, analysis: AnalysisResult): Promise<void> {
  await db
    .prepare(
      `INSERT INTO analyses (
        id, opportunity_id, source, feasibility_score, profitability_score, summary, constraints, model, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      crypto.randomUUID(),
      opportunityId,
      source,
      analysis.feasibilityScore,
      analysis.profitabilityScore,
      JSON.stringify(analysis.summaryBullets),
      JSON.stringify(analysis.constraints),
      analysis.model,
      new Date().toISOString()
    )
    .run();
}

export async function listExclusionRules(db: D1Database, activeOnly = true): Promise<ExclusionRule[]> {
  const whereClause = activeOnly ? "WHERE active = 1" : "";
  const results = await db
    .prepare(
      `SELECT id, rule_type as ruleType, value, active, created_at as createdAt
       FROM exclusion_rules
       ${whereClause}
       ORDER BY created_at DESC`
    )
    .all<{ id: string; ruleType: ExclusionRuleType; value: string; active: number; createdAt: string }>();

  return (
    results.results?.map((rule) => ({
      ...rule,
      active: Boolean(rule.active)
    })) ?? []
  );
}

export async function insertExclusionRule(
  db: D1Database,
  ruleType: ExclusionRuleType,
  value: string
): Promise<ExclusionRule> {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await db
    .prepare("INSERT INTO exclusion_rules (id, rule_type, value, active, created_at) VALUES (?, ?, ?, 1, ?)")
    .bind(id, ruleType, value, createdAt)
    .run();

  return {
    id,
    ruleType,
    value,
    active: true,
    createdAt
  };
}

export async function disableExclusionRule(db: D1Database, id: string): Promise<boolean> {
  const result = await db.prepare("UPDATE exclusion_rules SET active = 0 WHERE id = ?").bind(id).run();
  return Boolean(result.meta?.changes);
}

export async function getAdminSummary(db: D1Database): Promise<AdminSummary> {
  const totals = await db
    .prepare(
      `SELECT
        COUNT(*) as total,
        SUM(for_profit_eligible) as forProfitEligible,
        MAX(updated_at) as lastUpdated
      FROM opportunities`
    )
    .first<{ total: number | null; forProfitEligible: number | null; lastUpdated: string | null }>();

  const analyses = await db
    .prepare(
      `SELECT
        COUNT(DISTINCT opportunity_id || ':' || source) as analyzed,
        COUNT(DISTINCT CASE WHEN feasibility_score >= 80 THEN opportunity_id || ':' || source END) as highFeasibility
      FROM analyses`
    )
    .first<{ analyzed: number | null; highFeasibility: number | null }>();

  const sources = await db
    .prepare(
      `SELECT
        source,
        COUNT(*) as total,
        SUM(for_profit_eligible) as forProfitEligible,
        MAX(updated_at) as lastUpdated
      FROM opportunities
      GROUP BY source`
    )
    .all<{ source: SourceSystem; total: number; forProfitEligible: number; lastUpdated: string | null }>();

  return {
    totalOpportunities: Number(totals?.total ?? 0),
    forProfitEligible: Number(totals?.forProfitEligible ?? 0),
    analyzed: Number(analyses?.analyzed ?? 0),
    highFeasibility: Number(analyses?.highFeasibility ?? 0),
    lastUpdated: totals?.lastUpdated ?? null,
    sources: sources.results ?? []
  };
}
