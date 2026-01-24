import { fetchFundingSources, fetchAdminSummary, fetchExclusionRules } from "../../lib/admin";
import SourceRowWrapper from "../../components/SourceRowWrapper";
import OpportunityList from "../../components/OpportunityList";
import { INTEGRATION_TYPE_OPTIONS } from "../../lib/constants";
import { fetchOpportunities } from "../../lib/opportunities";
import { handleSync, handleToggle, handleSyncAll, handleSourceSync, handleSourceUpdate, handleRowSync, handleAddRule, handleDisableRule } from "./actions";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

type SyncStatus = "syncing" | "scheduled" | "success" | "failed" | "manual" | "inactive" | "never";

function getSyncStatus(source: Awaited<ReturnType<typeof fetchFundingSources>>["sources"][0]): SyncStatus {
  if (!source.active) return "inactive";
  
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

export default async function SourcesPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams instanceof Promise ? await searchParams : (searchParams ?? {});
  
  // Fetch data with error handling
  let sourcesResult: Awaited<ReturnType<typeof fetchFundingSources>>;
  let summaryResult: Awaited<ReturnType<typeof fetchAdminSummary>>;
  let exclusionsResult: Awaited<ReturnType<typeof fetchExclusionRules>>;
  let highSignal: Awaited<ReturnType<typeof fetchOpportunities>>;

  try {
    [sourcesResult, summaryResult, exclusionsResult, highSignal] = await Promise.all([
      fetchFundingSources().catch((err) => {
        console.error("Error fetching sources:", err);
        return { sources: [], warning: `Failed to load sources: ${err instanceof Error ? err.message : "Unknown error"}` } as Awaited<ReturnType<typeof fetchFundingSources>>;
      }),
      fetchAdminSummary().catch((err) => {
        console.error("Error fetching summary:", err);
        return { summary: null, warning: `Failed to load summary: ${err instanceof Error ? err.message : "Unknown error"}` } as Awaited<ReturnType<typeof fetchAdminSummary>>;
      }),
      fetchExclusionRules().catch((err) => {
        console.error("Error fetching exclusions:", err);
        return { rules: [], warning: `Failed to load filters: ${err instanceof Error ? err.message : "Unknown error"}` } as Awaited<ReturnType<typeof fetchExclusionRules>>;
      }),
      fetchOpportunities({ minScore: "75", limit: 5 }).catch((err) => {
        console.error("Error fetching opportunities:", err);
        return { items: [], warning: `Failed to load opportunities: ${err instanceof Error ? err.message : "Unknown error"}` } as Awaited<ReturnType<typeof fetchOpportunities>>;
      })
    ]);
  } catch (error) {
    console.error("Critical error loading sources page:", error);
    // Fallback to empty data
    sourcesResult = { sources: [], warning: "Failed to load page data" };
    summaryResult = { summary: null, warning: "Failed to load page data" };
    exclusionsResult = { rules: [], warning: "Failed to load page data" };
    highSignal = { items: [], warning: "Failed to load page data" };
  }

  const sources = sourcesResult.sources;

  // Sort alphabetically only, don't reorder on toggle
  const sortedSources = [...sources].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="grid">
      <section className="hero">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
          <div>
            <h2 className="hero__title" style={{ margin: 0, marginBottom: "8px" }}>Sources</h2>
            <p className="hero__subtitle" style={{ margin: 0 }}>Manage and monitor funding source integrations</p>
          </div>
          <form action={handleSyncAll} style={{ margin: 0 }}>
            <button className="button" type="submit">
              Sync All Sources
            </button>
          </form>
        </div>
        {sourcesResult.warning ? (
          <div className="card card--flat" style={{ background: "#fef3c7", color: "#92400e", padding: "12px 16px", marginBottom: "24px" }}>
            {sourcesResult.warning}
          </div>
        ) : null}
      </section>

      {/* Overview Stats */}
      <div className="grid grid-3" style={{ marginBottom: "24px", gap: "8px" }}>
        <div className="card" style={{ padding: "12px 16px" }}>
          <p className="muted" style={{ margin: 0, marginBottom: "4px", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total opportunities</p>
          <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "var(--text)", lineHeight: "1.2" }}>{summaryResult.summary?.totalOpportunities ?? 0}</h3>
        </div>
        <div className="card" style={{ padding: "12px 16px" }}>
          <p className="muted" style={{ margin: 0, marginBottom: "4px", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>For-profit eligible</p>
          <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "var(--text)", lineHeight: "1.2" }}>{summaryResult.summary?.forProfitEligible ?? 0}</h3>
        </div>
        <div className="card" style={{ padding: "12px 16px" }}>
          <p className="muted" style={{ margin: 0, marginBottom: "4px", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Analyzed w/ AI</p>
          <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "var(--text)", lineHeight: "1.2" }}>{summaryResult.summary?.analyzed ?? 0}</h3>
        </div>
        <div className="card" style={{ padding: "12px 16px" }}>
          <p className="muted" style={{ margin: 0, marginBottom: "4px", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>High feasibility</p>
          <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "var(--text)", lineHeight: "1.2" }}>{summaryResult.summary?.highFeasibility ?? 0}</h3>
        </div>
        <div className="card" style={{ padding: "12px 16px" }}>
          <p className="muted" style={{ margin: 0, marginBottom: "4px", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Last update</p>
          <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--text)", lineHeight: "1.2" }}>{summaryResult.summary?.lastUpdated ?? "N/A"}</h3>
        </div>
        <div className="card" style={{ padding: "12px 16px" }}>
          <p className="muted" style={{ margin: 0, marginBottom: "4px", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Active sources</p>
          <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "var(--text)", lineHeight: "1.2" }}>{sources.filter(s => s.active).length}</h3>
        </div>
      </div>

      {/* High-signal opportunities */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <h3 style={{ marginTop: 0, marginBottom: "16px" }}>High-signal opportunities</h3>
        <OpportunityList items={highSignal.items} />
      </div>

      {/* Sources Table */}
      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ padding: "12px 16px", textAlign: "center", width: "120px" }}>Enable</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Source</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "left", width: "140px" }}>Last Sync</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Ingested</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Type</th>
                <th style={{ padding: "12px 16px", textAlign: "center", width: "120px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedSources.map((source) => {
                const status = getSyncStatus(source);
                const statusColor = getStatusColor(status);
                const statusLabel = getStatusLabel(status);

                return (
                  <SourceRowWrapper
                    key={source.id}
                    source={{
                      ...source,
                      expectedResults: source.expectedResults ?? null,
                      homepage: source.homepage ?? null
                    }}
                    status={status}
                    statusColor={statusColor}
                    statusLabel={statusLabel}
                    handleSync={handleSync}
                    handleToggle={handleToggle}
                    handleSourceSync={handleSourceSync}
                    handleSourceUpdate={handleSourceUpdate}
                    handleRowSync={handleRowSync}
                    integrationTypeOptions={INTEGRATION_TYPE_OPTIONS}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

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
}
