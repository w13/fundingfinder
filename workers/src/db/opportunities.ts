import type {
  AnalysisResult,
  OpportunityDetail,
  OpportunityListItem,
  OpportunityQuery,
  OpportunityRecord,
  SectionSlices,
  SourceSystem
} from "../types";
import { safeJsonParse } from "../utils";

export class OpportunityRepository {
  constructor(private db: D1Database) {}

  async upsert(record: OpportunityRecord): Promise<{ id: string; version: number; updated: boolean }> {
    const existing = await this.db
      .prepare("SELECT id, version, version_hash FROM opportunities WHERE opportunity_id = ? AND source = ?")
      .bind(record.opportunityId, record.source)
      .first<{ id: string; version: number; version_hash: string }>();

    const now = new Date().toISOString();
    if (!existing) {
      await this.db
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

      await this.insertVersion(record, record.version, now);
      return { id: record.id, version: record.version, updated: true };
    }

    if (existing.version_hash !== record.versionHash) {
      const nextVersion = existing.version + 1;
      await this.db
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

      await this.insertVersion(record, nextVersion, now);
      return { id: existing.id, version: nextVersion, updated: true };
    }

    await this.db.prepare("UPDATE opportunities SET updated_at = ? WHERE id = ?").bind(now, existing.id).run();
    return { id: existing.id, version: existing.version, updated: false };
  }

  private async insertVersion(record: OpportunityRecord, version: number, timestamp: string): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO opportunity_versions (
          id, opportunity_id, source, version, payload, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(crypto.randomUUID(), record.opportunityId, record.source, version, JSON.stringify(record.rawPayload), timestamp)
      .run();
  }

  async list(query: OpportunityQuery): Promise<OpportunityListItem[]> {
    if (query.query) {
      return this.listFts(query);
    }
    return this.listStandard(query);
  }

  private async listStandard(query: OpportunityQuery): Promise<OpportunityListItem[]> {
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

    const results = await this.db.prepare(statement).bind(...params, limit).all<OpportunityListItem>();
    return results.results ?? [];
  }

  private async listFts(query: OpportunityQuery): Promise<OpportunityListItem[]> {
    const ftsQuery = this.buildFtsQuery(query.query ?? "", query.mode ?? "smart");
    if (!ftsQuery) {
      return this.listStandard({ ...query, query: undefined });
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

    const results = await this.db.prepare(statement).bind(...params, limit).all<OpportunityListItem & { rank: number }>();
    return results.results ?? [];
  }

  private buildFtsQuery(query: string, mode: "smart" | "exact" | "any"): string | null {
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

  async getById(id: string): Promise<OpportunityDetail | null> {
    const row = await this.db
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

    const documents = await this.db
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

  async insertDocument(
    opportunityId: string,
    source: SourceSystem,
    documentUrl: string,
    r2Key: string,
    textExcerpt: string,
    sectionMap: SectionSlices
  ): Promise<void> {
    await this.db
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

  async insertAnalysis(opportunityId: string, source: SourceSystem, analysis: AnalysisResult): Promise<void> {
    await this.db
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
}
