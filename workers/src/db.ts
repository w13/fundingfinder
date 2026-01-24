import type {
  AdminSummary,
  AnalysisResult,
  ExclusionRule,
  ExclusionRuleType,
  FundingSource,
  OpportunityRecord,
  SectionSlices,
  SourceIntegrationType,
  SourceSystem
} from "./types";
import { safeJsonParse } from "./utils";

export interface OpportunityQuery {
  query?: string;
  source?: SourceSystem;
  minScore?: number;
  limit?: number;
  mode?: "smart" | "exact" | "any";
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
  suitabilityScore: number | null;
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
  if (query.query) {
    return listOpportunitiesFts(db, query);
  }
  return listOpportunitiesStandard(db, query);
}

async function listOpportunitiesStandard(db: D1Database, query: OpportunityQuery): Promise<OpportunityListItem[]> {
  const conditions: string[] = [];
  const params: Array<string | number> = [];

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
    WITH LatestAnalyses AS (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY opportunity_id, source ORDER BY created_at DESC) as rn
      FROM analyses
    )
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
      a.suitability_score as suitabilityScore,
      a.profitability_score as profitabilityScore
    FROM opportunities o
    LEFT JOIN LatestAnalyses a
      ON a.opportunity_id = o.opportunity_id
      AND a.source = o.source
      AND a.rn = 1
    ${whereClause}
    ORDER BY (a.feasibility_score IS NULL) ASC, a.feasibility_score DESC, o.posted_date DESC
    LIMIT ?
  `;

  const results = await db.prepare(statement).bind(...params, limit).all<OpportunityListItem>();
  return results.results ?? [];
}

async function listOpportunitiesFts(db: D1Database, query: OpportunityQuery): Promise<OpportunityListItem[]> {
  const ftsQuery = buildFtsQuery(query.query ?? "", query.mode ?? "smart");
  if (!ftsQuery) {
    return listOpportunitiesStandard(db, { ...query, query: undefined });
  }

  const conditions: string[] = ["f MATCH ?"];
  const params: Array<string | number> = [ftsQuery];

  if (query.source) {
    conditions.push("o.source = ?");
    params.push(query.source);
  }

  if (typeof query.minScore === "number") {
    conditions.push("a.feasibility_score >= ?");
    params.push(query.minScore);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;
  const limit = query.limit ?? 50;

  const statement = `
    WITH LatestAnalyses AS (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY opportunity_id, source ORDER BY created_at DESC) as rn
      FROM analyses
    )
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
      a.suitability_score as suitabilityScore,
      a.profitability_score as profitabilityScore,
      bm25(f, 6.0, 3.0, 2.0) as rank
    FROM opportunities_fts f
    JOIN opportunities o
      ON o.opportunity_id = f.opportunity_id AND o.source = f.source
    LEFT JOIN LatestAnalyses a
      ON a.opportunity_id = o.opportunity_id
      AND a.source = o.source
      AND a.rn = 1
    ${whereClause}
    ORDER BY rank ASC, o.posted_date DESC
    LIMIT ?
  `;

  const results = await db.prepare(statement).bind(...params, limit).all<OpportunityListItem & { rank: number }>();
  return results.results ?? [];
}

function buildFtsQuery(query: string, mode: "smart" | "exact" | "any"): string | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  if (mode === "exact") {
    const sanitized = trimmed.replace(/["]/g, "");
    return `"${sanitized}"`;
  }

  const tokens = trimmed.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  if (tokens.length === 0) return null;
  const operator = mode === "any" ? " OR " : " AND ";
  return tokens.map((token) => `${token}*`).join(operator);
}

export async function getOpportunityById(db: D1Database, id: string): Promise<OpportunityDetail | null> {
  const row = await db
    .prepare(
      `WITH LatestAnalyses AS (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY opportunity_id, source ORDER BY created_at DESC) as rn
        FROM analyses
      )
      SELECT
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
        a.suitability_score as suitabilityScore,
        a.profitability_score as profitabilityScore,
        a.summary as analysisSummary,
        a.constraints as constraints
      FROM opportunities o
      LEFT JOIN LatestAnalyses a
        ON a.opportunity_id = o.opportunity_id
        AND a.source = o.source
        AND a.rn = 1
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
      suitabilityScore: number | null;
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
    suitabilityScore: row.suitabilityScore,
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
        id, opportunity_id, source, feasibility_score, suitability_score, profitability_score, summary, constraints, model, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      crypto.randomUUID(),
      opportunityId,
      source,
      analysis.feasibilityScore,
      analysis.suitabilityScore,
      analysis.profitabilityScore,
      JSON.stringify(analysis.summaryBullets),
      JSON.stringify(analysis.constraints),
      analysis.model,
      new Date().toISOString()
    )
    .run();
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
        a.profitability_score as profitabilityScore
      FROM shortlist s
      JOIN opportunities o ON o.opportunity_id = s.opportunity_id AND o.source = s.source
      LEFT JOIN LatestAnalyses a
        ON a.opportunity_id = o.opportunity_id
        AND a.source = o.source
        AND a.rn = 1
      ORDER BY s.created_at DESC`
    )
    .all<ShortlistItem>();

  return results.results ?? [];
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

export async function listFundingSources(db: D1Database, activeOnly = false): Promise<FundingSource[]> {
  const whereClause = activeOnly ? "WHERE active = 1" : "";
  const results = await db
    .prepare(
      `SELECT
        id,
        name,
        country,
        homepage,
        integration_type as integrationType,
        auto_url as autoUrl,
        expected_results as expectedResults,
        active,
        last_sync as lastSync,
        last_status as lastStatus,
        last_error as lastError,
        last_ingested as lastIngested,
        created_at as createdAt,
        updated_at as updatedAt
      FROM funding_sources
      ${whereClause}
      ORDER BY name`
    )
    .all<{
      id: string;
      name: string;
      country: string | null;
      homepage: string | null;
      integrationType: SourceIntegrationType;
      autoUrl: string | null;
      expectedResults: number | null;
      active: number;
      lastSync: string | null;
      lastStatus: string | null;
      lastError: string | null;
      lastIngested: number | null;
      createdAt: string;
      updatedAt: string;
    }>();

  return (
    results.results?.map((row) => ({
      ...row,
      active: Boolean(row.active),
      lastIngested: Number(row.lastIngested ?? 0)
    })) ?? []
  );
}

export async function getFundingSource(db: D1Database, id: string): Promise<FundingSource | null> {
  const row = await db
    .prepare(
      `SELECT
        id,
        name,
        country,
        homepage,
        integration_type as integrationType,
        auto_url as autoUrl,
        expected_results as expectedResults,
        active,
        last_sync as lastSync,
        last_status as lastStatus,
        last_error as lastError,
        last_ingested as lastIngested,
        created_at as createdAt,
        updated_at as updatedAt
      FROM funding_sources
      WHERE id = ?`
    )
    .bind(id)
    .first<{
      id: string;
      name: string;
      country: string | null;
      homepage: string | null;
      integrationType: SourceIntegrationType;
      autoUrl: string | null;
      expectedResults: number | null;
      active: number;
      lastSync: string | null;
      lastStatus: string | null;
      lastError: string | null;
      lastIngested: number | null;
      createdAt: string;
      updatedAt: string;
    }>();

  if (!row) return null;
  return {
    ...row,
    active: Boolean(row.active),
    lastIngested: Number(row.lastIngested ?? 0)
  };
}

export async function updateFundingSource(
  db: D1Database,
  id: string,
  updates: {
    integrationType?: SourceIntegrationType;
    autoUrl?: string | null;
    active?: boolean;
  }
): Promise<boolean> {
  const fields: string[] = [];
  const values: Array<string | number | null> = [];

  if (updates.integrationType) {
    fields.push("integration_type = ?");
    values.push(updates.integrationType);
  }
  if (typeof updates.autoUrl !== "undefined") {
    fields.push("auto_url = ?");
    values.push(updates.autoUrl);
  }
  if (typeof updates.active === "boolean") {
    fields.push("active = ?");
    values.push(updates.active ? 1 : 0);
  }

  if (fields.length === 0) return false;

  fields.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  const result = await db
    .prepare(`UPDATE funding_sources SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();

  return Boolean(result.meta?.changes);
}

export async function updateFundingSourceSync(
  db: D1Database,
  id: string,
  payload: { status: string; error?: string | null; ingested?: number }
): Promise<void> {
  await db
    .prepare(
      `UPDATE funding_sources SET
        last_sync = ?,
        last_status = ?,
        last_error = ?,
        last_ingested = ?,
        updated_at = ?
      WHERE id = ?`
    )
    .bind(
      new Date().toISOString(),
      payload.status,
      payload.error ?? null,
      payload.ingested ?? 0,
      new Date().toISOString(),
      id
    )
    .run();
}
