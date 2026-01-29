import Link from "next/link";
import { fetchAdminOverview } from "../../lib/api/admin";
import SourcesTable from "../../components/SourcesTable";
import SyncAllButton from "../../components/SyncAllButton";
import ToggleAllButton from "../../components/ToggleAllButton";
import { INTEGRATION_TYPE_OPTIONS } from "../../lib/domain/constants";
import { handleSync, handleToggle, handleSyncAll, handleSourceSync, handleSourceUpdate, handleRowSync, handleAddRule, handleDisableRule, handleToggleAll } from "./actions";
import { logServerError } from "../../lib/errors/serverErrorLogger";
import WarningBanner from "../../components/WarningBanner";
import { isReadOnlyMode } from "../../lib/domain/constants";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

type SyncStatus = "syncing" | "scheduled" | "success" | "failed" | "manual" | "inactive" | "never";

function getSyncStatus(source: Awaited<ReturnType<typeof fetchAdminOverview>>["sources"][0]): SyncStatus {
  if (!source.active) return "inactive";
  
  if (source.lastStatus === "syncing") return "syncing";
  
  if (!source.lastSync) return "never";
  
  // Check if recently synced (within last 5 minutes) - could be syncing
  const lastSyncTime = new Date(source.lastSync).getTime();
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  if (lastSyncTime > fiveMinutesAgo && source.lastStatus === null) {
    return "syncing";
  }
  
  if (source.lastStatus === "failed") return "failed";
  if (source.lastStatus === "success") {
    // If has autoUrl, it's scheduled; otherwise manual
    return source.autoUrl ? "scheduled" : "success";
  }
  
  // Active but no auto sync configured
  if (!source.autoUrl) return "manual";
  
  return "scheduled";
}

function getStatusColor(status: SyncStatus): string {
  switch (status) {
    case "syncing":
      return "#3b82f6"; // blue
    case "scheduled":
      return "#10b981"; // green
    case "success":
      return "#10b981"; // green
    case "failed":
      return "#ef4444"; // red
    case "manual":
      return "#f59e0b"; // yellow/amber
    case "inactive":
      return "#6b7280"; // gray
    case "never":
      return "#9ca3af"; // light gray
    default:
      return "#6b7280";
  }
}

function getStatusLabel(status: SyncStatus): string {
  switch (status) {
    case "syncing":
      return "Syncing now";
    case "scheduled":
      return "Scheduled";
    case "success":
      return "Synced";
    case "failed":
      return "Failed";
    case "manual":
      return "Manual only";
    case "inactive":
      return "Inactive";
    case "never":
      return "Never synced";
    default:
      return "Unknown";
  }
}

// Force dynamic rendering to avoid static generation issues
export const dynamic = "force-dynamic";

export default async function SourcesPage({ searchParams }: PageProps) {
  try {
    let overviewResult: Awaited<ReturnType<typeof fetchAdminOverview>>;

    try {
      overviewResult = await fetchAdminOverview().catch((err) => {
        logServerError(err, { component: "SourcesPage", action: "fetchAdminOverview" });
        return {
          summary: null,
          sources: [],
          rules: [],
          sourceHealth: [],
          pdfMetrics: null,
          warning: `Failed to load overview: ${err instanceof Error ? err.message : "Unknown error"}`
        } as Awaited<ReturnType<typeof fetchAdminOverview>>;
      });
    } catch (error) {
      logServerError(error, { component: "SourcesPage", action: "fetchAdminOverview" });
      overviewResult = {
        summary: null,
        sources: [],
        rules: [],
        sourceHealth: [],
        pdfMetrics: null,
        warning: "Failed to load page data"
      };
    }

  const sources = overviewResult.sources;
  const summary = overviewResult.summary;
  const exclusions = overviewResult.rules;
  const sourceHealth = overviewResult.sourceHealth;
  const pdfMetrics = overviewResult.pdfMetrics;
  const healthMap = new Map(sourceHealth.map((item) => [item.sourceId, item]));
  const readOnly = isReadOnlyMode();
  const adminKeyWarning = overviewResult.adminKeyConfigured === false ? "Admin API key not configured. Mutating actions will be blocked." : null;

  // Compute sync status, color, and label for each source on the server
  const sourcesWithStatus = sources.map((source) => {
    const status = getSyncStatus(source);
    const health = healthMap.get(source.id) ?? {
      sourceId: source.id,
      lastSuccessfulSync: source.lastSuccessfulSync ?? null,
      errorRate: source.lastStatus === "failed" ? 1 : 0,
      ingestedLast24h: 0,
      recentFailures: source.lastStatus === "failed" ? 1 : 0,
      lastError: source.lastError ?? null
    };
    return {
      ...source,
      syncStatus: status,
      statusColor: getStatusColor(status),
      statusLabel: getStatusLabel(status),
      health
    };
  });

  const activeSources = sources.filter((s) => s.active);
  const failingSources = sourcesWithStatus.filter((s) => s.syncStatus === "failed");
  const allFailing = activeSources.length > 0 && failingSources.length === activeSources.length;

  const backlogStuck = pdfMetrics?.queued && pdfMetrics.lastCompletedAt
    ? Date.now() - new Date(pdfMetrics.lastCompletedAt).getTime() > 24 * 60 * 60 * 1000
    : false;

  return (
    <div className="grid">
      <section className="hero">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
          <div>
            <h2 className="hero__title" style={{ margin: 0, marginBottom: "8px" }}>Sources</h2>
            <p className="hero__subtitle" style={{ margin: 0 }}>Manage and monitor funding source integrations</p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <SyncAllButton 
              action={handleSyncAll} 
              activeSources={activeSources.map(s => ({ id: s.id, name: s.name }))}
              readOnly={readOnly}
            />
          </div>
        </div>
        <WarningBanner warnings={[overviewResult.warning, adminKeyWarning].filter(Boolean)} />
      </section>

      {/* Overview Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px", marginBottom: "24px" }}>
        <div className="card" style={{ padding: "10px 12px" }}>
          <p className="muted" style={{ margin: 0, marginBottom: "4px", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total opportunities</p>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--text)", lineHeight: "1.2" }}>{summary?.totalOpportunities ?? 0}</h3>
        </div>
        <div className="card" style={{ padding: "10px 12px" }}>
          <p className="muted" style={{ margin: 0, marginBottom: "4px", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em" }}>For-profit eligible</p>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--text)", lineHeight: "1.2" }}>{summary?.forProfitEligible ?? 0}</h3>
        </div>
        <div className="card" style={{ padding: "10px 12px" }}>
          <p className="muted" style={{ margin: 0, marginBottom: "4px", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Analyzed w/ AI</p>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--text)", lineHeight: "1.2" }}>{summary?.analyzed ?? 0}</h3>
        </div>
        <div className="card" style={{ padding: "10px 12px" }}>
          <p className="muted" style={{ margin: 0, marginBottom: "4px", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em" }}>High feasibility</p>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--text)", lineHeight: "1.2" }}>{summary?.highFeasibility ?? 0}</h3>
        </div>
        <div className="card" style={{ padding: "10px 12px" }}>
          <p className="muted" style={{ margin: 0, marginBottom: "4px", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Last update</p>
          <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "var(--text)", lineHeight: "1.2" }}>{summary?.lastUpdated ?? "N/A"}</h3>
        </div>
        <div className="card" style={{ padding: "10px 12px" }}>
          <p className="muted" style={{ margin: 0, marginBottom: "4px", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Active sources</p>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--text)", lineHeight: "1.2" }}>{activeSources.length}</h3>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
        <div className="card" style={{ padding: "16px" }}>
          <h4 style={{ margin: "0 0 8px" }}>Source health</h4>
          <p className="muted" style={{ margin: 0, fontSize: "13px" }}>
            {allFailing ? "All active sources are currently failing." : `${failingSources.length} sources failing in the last 30 days.`}
          </p>
        </div>
        <div className="card" style={{ padding: "16px" }}>
          <h4 style={{ margin: "0 0 8px" }}>24h ingestion</h4>
          <p className="muted" style={{ margin: 0, fontSize: "13px" }}>
            {sourceHealth.reduce((sum, item) => sum + (item.ingestedLast24h ?? 0), 0).toLocaleString()} notices ingested in the last 24h.
          </p>
        </div>
        <div className="card" style={{ padding: "16px" }}>
          <h4 style={{ margin: "0 0 8px" }}>Processing pipeline</h4>
          <p className="muted" style={{ margin: 0, fontSize: "13px" }}>
            {pdfMetrics ? `${pdfMetrics.queued} queued · ${pdfMetrics.processing} processing · ${pdfMetrics.failedLast24h} failed (24h)` : "No PDF pipeline metrics yet."}
          </p>
          {backlogStuck && (
            <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#b45309" }}>
              Backlog appears stuck (no completions in 24h).
            </p>
          )}
        </div>
      </div>

      {sources.length === 0 && (
        <div className="card" style={{ marginBottom: "24px" }}>
          <h3 style={{ marginTop: 0 }}>No sources configured</h3>
          <p className="muted" style={{ margin: 0 }}>
            Add a source in the <Link href="/admin" style={{ color: "var(--primary)" }}>admin setup</Link> page to start ingestion.
          </p>
        </div>
      )}

      {/* Sources Table */}
      <SourcesTable
        sources={sourcesWithStatus}
        handleSync={handleSync}
        handleToggle={handleToggle}
        handleSourceSync={handleSourceSync}
        handleSourceUpdate={handleSourceUpdate}
        handleRowSync={handleRowSync}
        integrationTypeOptions={INTEGRATION_TYPE_OPTIONS}
        readOnly={readOnly}
        toggleAllComponent={
          <ToggleAllButton
            action={handleToggleAll}
            allActive={sources.length > 0 && sources.every(s => s.active)}
            totalCount={sources.length}
            readOnly={readOnly}
          />
        }
      />

      {/* Filters/Exclusions */}
      <div className="card" style={{ marginTop: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 style={{ margin: 0, marginBottom: "4px" }}>Filters</h3>
            <p className="muted" style={{ margin: 0, fontSize: "13px" }}>
              Configure inclusion and exclusion rules for opportunity filtering
            </p>
          </div>
        </div>
        
        <div className="grid grid-2" style={{ marginBottom: "20px" }}>
          <div>
            <h4 style={{ margin: 0, marginBottom: "12px", fontSize: "14px", fontWeight: 600 }}>Add New Filter</h4>
            <form className="grid" action={handleAddRule} style={{ gap: "12px" }}>
              <label style={{ display: "grid", gap: "8px" }}>
                <span className="pill" style={{ fontSize: "11px" }}>Filter Type</span>
                <select className="select" name="ruleType" defaultValue="excluded_bureau" disabled={readOnly}>
                  <option value="excluded_bureau">Exclude bureau/agency</option>
                  <option value="priority_agency">Priority agency</option>
                </select>
              </label>
              <label style={{ display: "grid", gap: "8px" }}>
                <span className="pill" style={{ fontSize: "11px" }}>Agency/Bureau Name</span>
                <input className="input" name="value" placeholder="e.g. USDA, Forestry, NIH" disabled={readOnly} />
              </label>
              <button className="button" type="submit" disabled={readOnly}>
                {readOnly ? "Read-only" : "Add Filter"}
              </button>
            </form>
          </div>
          <div>
            <h4 style={{ margin: 0, marginBottom: "12px", fontSize: "14px", fontWeight: 600 }}>Active Filters</h4>
            {exclusions.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {exclusions.map((rule) => (
                  <div
                    key={rule.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 12px",
                      background: "#f8fafc",
                      border: "1px solid var(--border-light)",
                      borderRadius: "0"
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "2px" }}>
                        {rule.ruleType === "excluded_bureau" ? "Exclude" : "Priority"}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        {rule.value}
                      </div>
                    </div>
                    <form action={handleDisableRule} style={{ margin: 0 }}>
                      <input type="hidden" name="id" value={rule.id} />
                      <button
                        className="button button--secondary button--small"
                        type="submit"
                        style={{ padding: "4px 10px" }}
                        disabled={readOnly}
                      >
                        {readOnly ? "Read-only" : "Remove"}
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "20px", textAlign: "center", background: "#f8fafc", border: "1px solid var(--border-light)" }}>
                <p className="muted" style={{ margin: 0, fontSize: "13px" }}>No filters configured</p>
                <p className="muted" style={{ margin: "4px 0 0", fontSize: "12px" }}>Add filters to customize opportunity matching</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  } catch (error) {
    logServerError(error, { component: "SourcesPage", action: "render" });
    throw error; // Re-throw to let Next.js error boundary handle it
  }
}
