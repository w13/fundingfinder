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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <h2 className="hero__title" style={{ margin: 0 }}>Sources</h2>
          <form action={handleSyncAll} style={{ margin: 0 }}>
            <button className="button" type="submit" style={{ padding: "8px 16px", fontSize: "14px" }}>
              Sync All Sources
            </button>
          </form>
        </div>
        {sourcesResult.warning ? (
          <div className="card card--flat" style={{ background: "#fef3c7", color: "#92400e", marginTop: "12px" }}>
            {sourcesResult.warning}
          </div>
        ) : null}
      </section>

      {/* Overview Stats */}
      <div className="grid grid-3" style={{ gap: "8px", marginBottom: "16px" }}>
        <div className="card">
          <p className="muted">Total opportunities</p>
          <h3 style={{ margin: "4px 0 0" }}>{summaryResult.summary?.totalOpportunities ?? 0}</h3>
        </div>
        <div className="card">
          <p className="muted">For-profit eligible</p>
          <h3 style={{ margin: "4px 0 0" }}>{summaryResult.summary?.forProfitEligible ?? 0}</h3>
        </div>
        <div className="card">
          <p className="muted">Analyzed w/ AI</p>
          <h3 style={{ margin: "4px 0 0" }}>{summaryResult.summary?.analyzed ?? 0}</h3>
        </div>
        <div className="card">
          <p className="muted">High feasibility</p>
          <h3 style={{ margin: "4px 0 0" }}>{summaryResult.summary?.highFeasibility ?? 0}</h3>
        </div>
        <div className="card">
          <p className="muted">Last update</p>
          <h3 style={{ margin: "4px 0 0" }}>{summaryResult.summary?.lastUpdated ?? "N/A"}</h3>
        </div>
        <div className="card">
          <p className="muted">Active sources</p>
          <h3 style={{ margin: "4px 0 0" }}>{sources.filter(s => s.active).length}</h3>
        </div>
      </div>

      {/* High-signal opportunities */}
      <div className="card" style={{ marginBottom: "16px" }}>
        <h3 style={{ marginTop: 0 }}>High-signal opportunities</h3>
        <OpportunityList items={highSignal.items} />
      </div>

      {/* Filters/Exclusions */}
      <div className="card" style={{ marginBottom: "16px" }}>
        <h3 style={{ marginTop: 0 }}>Filters</h3>
        {exclusionsResult.warning ? (
          <div className="card card--flat" style={{ background: "#fef3c7", color: "#92400e", marginBottom: "12px" }}>
            {exclusionsResult.warning}
          </div>
        ) : null}
        <div className="grid grid-2" style={{ gap: "12px", marginBottom: "12px" }}>
          <div>
            <h4 style={{ marginTop: 0, marginBottom: "8px", fontSize: "14px" }}>Add Filter</h4>
            <form className="grid" action={handleAddRule} style={{ gap: "8px" }}>
              <label style={{ display: "grid", gap: "4px" }}>
                <span className="pill" style={{ fontSize: "11px", padding: "4px 8px" }}>Filter type</span>
                <select className="select" name="ruleType" defaultValue="excluded_bureau" style={{ padding: "8px 10px", fontSize: "13px" }}>
                  <option value="excluded_bureau">Exclude bureau/agency</option>
                  <option value="priority_agency">Priority agency</option>
                </select>
              </label>
              <label style={{ display: "grid", gap: "4px" }}>
                <span className="pill" style={{ fontSize: "11px", padding: "4px 8px" }}>Value</span>
                <input className="input" name="value" placeholder="e.g. USDA, Forestry" style={{ padding: "8px 10px", fontSize: "13px" }} />
              </label>
              <button className="button" type="submit" style={{ padding: "8px 14px", fontSize: "13px" }}>
                Add Filter
              </button>
            </form>
          </div>
          <div>
            <h4 style={{ marginTop: 0, marginBottom: "8px", fontSize: "14px" }}>Active Filters</h4>
            {exclusionsResult.rules.length ? (
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ padding: "8px", fontSize: "12px" }}>Type</th>
                    <th style={{ padding: "8px", fontSize: "12px" }}>Value</th>
                    <th style={{ padding: "8px", fontSize: "12px" }}>Created</th>
                    <th style={{ padding: "8px", fontSize: "12px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {exclusionsResult.rules.map((rule) => (
                    <tr key={rule.id}>
                      <td style={{ padding: "8px", fontSize: "12px" }}>{rule.ruleType === "excluded_bureau" ? "Exclude bureau" : "Priority agency"}</td>
                      <td style={{ padding: "8px", fontSize: "12px" }}>{rule.value}</td>
                      <td style={{ padding: "8px", fontSize: "12px" }}>{rule.createdAt}</td>
                      <td style={{ padding: "8px", fontSize: "12px" }}>
                        <form action={handleDisableRule} style={{ margin: 0, display: "inline-block" }}>
                          <input type="hidden" name="id" value={rule.id} />
                          <button className="button button--secondary" type="submit" style={{ padding: "4px 8px", fontSize: "11px" }}>
                            Disable
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="muted" style={{ fontSize: "13px" }}>No filters configured.</p>
            )}
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="card" style={{ marginBottom: "16px" }}>
        <h3 style={{ marginTop: 0 }}>Settings</h3>
        <div className="grid grid-2" style={{ gap: "12px" }}>
          <div>
            <p className="muted" style={{ fontSize: "12px", marginBottom: "8px" }}>Worker API</p>
            <p style={{ margin: 0, fontSize: "13px" }}>
              {typeof process !== 'undefined' && process.env
                ? (process.env.GRANT_SENTINEL_API_URL ?? process.env.NEXT_PUBLIC_GRANT_SENTINEL_API_URL ?? 'https://grant-sentinel.wakas.workers.dev')
                : 'https://grant-sentinel.wakas.workers.dev'}
            </p>
          </div>
          <div>
            <p className="muted" style={{ fontSize: "12px", marginBottom: "8px" }}>Secrets</p>
            <p style={{ margin: 0, fontSize: "13px" }}>
              Configure API keys, webhook URLs, and company profile via Wrangler secrets.
            </p>
          </div>
        </div>
      </div>

      {/* Sources Table */}
      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ width: "40px", padding: "12px 8px" }}></th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Source</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Last Sync</th>
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
    </div>
  );
}
