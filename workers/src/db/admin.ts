import type {
  AdminSummary,
  ExclusionRule,
  ExclusionRuleType,
  FundingSource,
  SourceIntegrationType,
  SourceSystem
} from "../types";

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

export async function toggleAllFundingSources(db: D1Database, active: boolean): Promise<number> {
  const result = await db
    .prepare(`UPDATE funding_sources SET active = ?, updated_at = ? WHERE active != ?`)
    .bind(active ? 1 : 0, new Date().toISOString(), active ? 1 : 0)
    .run();
  return result.meta?.changes ?? 0;
}
