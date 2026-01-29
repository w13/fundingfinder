import { fetchFundingSources, fetchAdminSummary, fetchExclusionRules } from "../../lib/api/admin";
import SourcesTable from "../../components/SourcesTable";
import SyncAllButton from "../../components/SyncAllButton";
import ToggleAllButton from "../../components/ToggleAllButton";
import { INTEGRATION_TYPE_OPTIONS } from "../../lib/domain/constants";
import { handleSync, handleToggle, handleSyncAll, handleSourceSync, handleSourceUpdate, handleRowSync, handleAddRule, handleDisableRule, handleToggleAll } from "./actions";
import { logServerError } from "../../lib/errors/serverErrorLogger";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

type SyncStatus = "syncing" | "scheduled" | "success" | "failed" | "manual" | "inactive" | "never";

function getSyncStatus(source: Awaited<ReturnType<typeof fetchFundingSources>>["sources"][0]): SyncStatus {
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
    const resolvedSearchParams = searchParams instanceof Promise ? await searchParams : (searchParams ?? {});
    
    // Fetch data with error handling
    let sourcesResult: Awaited<ReturnType<typeof fetchFundingSources>>;
    let summaryResult: Awaited<ReturnType<typeof fetchAdminSummary>>;
    let exclusionsResult: Awaited<ReturnType<typeof fetchExclusionRules>>;

    try {
      [sourcesResult, summaryResult, exclusionsResult] = await Promise.all([
        fetchFundingSources().catch((err) => {
          logServerError(err, { component: "SourcesPage", action: "fetchFundingSources" });
          return { sources: [], warning: `Failed to load sources: ${err instanceof Error ? err.message : "Unknown error"}` } as Awaited<ReturnType<typeof fetchFundingSources>>;
        }),
        fetchAdminSummary().catch((err) => {
          logServerError(err, { component: "SourcesPage", action: "fetchAdminSummary" });
          return { summary: null, warning: `Failed to load summary: ${err instanceof Error ? err.message : "Unknown error"}` } as Awaited<ReturnType<typeof fetchAdminSummary>>;
        }),
        fetchExclusionRules().catch((err) => {
          logServerError(err, { component: "SourcesPage", action: "fetchExclusionRules" });
          return { rules: [], warning: `Failed to load filters: ${err instanceof Error ? err.message : "Unknown error"}` } as Awaited<ReturnType<typeof fetchExclusionRules>>;
        })
    ]);
  } catch (error) {
    logServerError(error, { component: "SourcesPage", action: "fetchData" });
    // Fallback to empty data
    sourcesResult = { sources: [], warning: "Failed to load page data" };
    summaryResult = { summary: null, warning: "Failed to load page data" };
    exclusionsResult = { rules: [], warning: "Failed to load page data" };
  }

  const sources = sourcesResult.sources;

  // Compute sync status, color, and label for each source on the server
  const sourcesWithStatus = sources.map((source) => {
    const status = getSyncStatus(source);
    return {
      ...source,
      syncStatus: status,
      statusColor: getStatusColor(status),
      statusLabel: getStatusLabel(status)
    };
  });

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
              activeSources={sources.filter(s => s.active).map(s => ({ id: s.id, name: s.name }))}
            />
          </div>
        </div>
        {sourcesResult.warning ? (
          <div className="card card--flat" style={{ background: "#fef3c7", color: "#92400e", padding: "12px 16px", marginBottom: "24px" }}>
            {sourcesResult.warning}
          </div>
        ) : null}
      </section>

      {/* Overview Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px", marginBottom: "24px" }}>
        <div className="card" style={{ padding: "10px 12px" }}>
          <p className="muted" style={{ margin: 0, marginBottom: "4px", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total opportunities</p>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--text)", lineHeight: "1.2" }}>{summaryResult.summary?.totalOpportunities ?? 0}</h3>
        </div>
        <div className="card" style={{ padding: "10px 12px" }}>
          <p className="muted" style={{ margin: 0, marginBottom: "4px", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em" }}>For-profit eligible</p>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--text)", lineHeight: "1.2" }}>{summaryResult.summary?.forProfitEligible ?? 0}</h3>
        </div>
        <div className="card" style={{ padding: "10px 12px" }}>
          <p className="muted" style={{ margin: 0, marginBottom: "4px", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Analyzed w/ AI</p>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--text)", lineHeight: "1.2" }}>{summaryResult.summary?.analyzed ?? 0}</h3>
        </div>
        <div className="card" style={{ padding: "10px 12px" }}>
          <p className="muted" style={{ margin: 0, marginBottom: "4px", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em" }}>High feasibility</p>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--text)", lineHeight: "1.2" }}>{summaryResult.summary?.highFeasibility ?? 0}</h3>
        </div>
        <div className="card" style={{ padding: "10px 12px" }}>
          <p className="muted" style={{ margin: 0, marginBottom: "4px", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Last update</p>
          <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "var(--text)", lineHeight: "1.2" }}>{summaryResult.summary?.lastUpdated ?? "N/A"}</h3>
        </div>
        <div className="card" style={{ padding: "10px 12px" }}>
          <p className="muted" style={{ margin: 0, marginBottom: "4px", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Active sources</p>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--text)", lineHeight: "1.2" }}>{sources.filter(s => s.active).length}</h3>
        </div>
      </div>

      {/* Sources Table */}
      <SourcesTable
        sources={sourcesWithStatus}
        handleSync={handleSync}
        handleToggle={handleToggle}
        handleSourceSync={handleSourceSync}
        handleSourceUpdate={handleSourceUpdate}
        handleRowSync={handleRowSync}
        integrationTypeOptions={INTEGRATION_TYPE_OPTIONS}
        toggleAllComponent={
          <ToggleAllButton
            action={handleToggleAll}
            allActive={sources.length > 0 && sources.every(s => s.active)}
            totalCount={sources.length}
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
        
        {exclusionsResult.warning ? (
          <div className="card card--flat" style={{ background: "#fef3c7", color: "#92400e", marginBottom: "20px", padding: "12px 16px" }}>
            {exclusionsResult.warning}
          </div>
        ) : null}

        <div className="grid grid-2" style={{ marginBottom: "20px" }}>
          <div>
            <h4 style={{ margin: 0, marginBottom: "12px", fontSize: "14px", fontWeight: 600 }}>Add New Filter</h4>
            <form className="grid" action={handleAddRule} style={{ gap: "12px" }}>
              <label style={{ display: "grid", gap: "8px" }}>
                <span className="pill" style={{ fontSize: "11px" }}>Filter Type</span>
                <select className="select" name="ruleType" defaultValue="excluded_bureau">
                  <option value="excluded_bureau">Exclude bureau/agency</option>
                  <option value="priority_agency">Priority agency</option>
                </select>
              </label>
              <label style={{ display: "grid", gap: "8px" }}>
                <span className="pill" style={{ fontSize: "11px" }}>Agency/Bureau Name</span>
                <input className="input" name="value" placeholder="e.g. USDA, Forestry, NIH" />
              </label>
              <button className="button" type="submit">
                Add Filter
              </button>
            </form>
          </div>
          <div>
            <h4 style={{ margin: 0, marginBottom: "12px", fontSize: "14px", fontWeight: 600 }}>Active Filters</h4>
            {exclusionsResult.rules.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {exclusionsResult.rules.map((rule) => (
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
                      >
                        Remove
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
