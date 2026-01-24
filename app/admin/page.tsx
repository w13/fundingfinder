import { revalidatePath } from "next/cache";
import TabNav from "../../components/admin/TabNav";
import OpportunityList from "../../components/OpportunityList";
import {
  fetchAdminSummary,
  fetchExclusionRules,
  fetchFundingSources,
  createExclusionRule,
  disableExclusionRule,
  syncFundingSource,
  triggerIngestionSync,
  updateFundingSource
} from "../../lib/admin";
import { fetchOpportunities } from "../../lib/opportunities";
import { INTEGRATION_TYPE_OPTIONS } from "../../lib/constants";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

const VALID_TABS = ["overview", "sources", "exclusions", "settings"];

export default async function AdminPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams instanceof Promise ? await searchParams : (searchParams ?? {});
  const tabParam = typeof resolvedSearchParams?.tab === "string" ? resolvedSearchParams.tab : "overview";
  const activeTab = VALID_TABS.includes(tabParam) ? tabParam : "overview";

  const [summaryResult, exclusionsResult, highSignal, sourcesResult] = await Promise.all([
    fetchAdminSummary(),
    fetchExclusionRules(),
    fetchOpportunities({ minScore: "75", limit: 5 }),
    fetchFundingSources()
  ]);

  return (
    <div className="grid">
      <section className="hero">
        <p className="pill">Management</p>
        <h2 className="hero__title">Configure & Monitor</h2>
        <p className="hero__subtitle">
          Manage data sources, set filtering rules, and monitor pipeline activity.
        </p>
        {summaryResult.warning ? (
          <div className="card card--flat" style={{ background: "#fef3c7", color: "#92400e" }}>
            {summaryResult.warning}
          </div>
        ) : null}
      </section>

      <TabNav activeTab={activeTab} />

      {activeTab === "overview" ? (
        <OverviewTab summary={summaryResult.summary} highSignal={highSignal.items} />
      ) : null}
      {activeTab === "sources" ? (
        <SourcesTab sources={sourcesResult.sources} warning={sourcesResult.warning} />
      ) : null}
      {activeTab === "exclusions" ? (
        <ExclusionsTab rules={exclusionsResult.rules} warning={exclusionsResult.warning} />
      ) : null}
      {activeTab === "settings" ? <SettingsTab /> : null}
    </div>
  );
}

function OverviewTab({
  summary,
  highSignal
}: {
  summary: Awaited<ReturnType<typeof fetchAdminSummary>>["summary"];
  highSignal: Awaited<ReturnType<typeof fetchOpportunities>>["items"];
}) {
  async function handleRunSync() {
    "use server";
    await triggerIngestionSync();
    revalidatePath("/admin");
  }

  return (
    <section className="grid">
      <div className="grid grid-3">
        <div className="card">
          <p className="muted">Total opportunities</p>
          <h3 style={{ margin: "6px 0 0" }}>{summary?.totalOpportunities ?? 0}</h3>
        </div>
        <div className="card">
          <p className="muted">For-profit eligible</p>
          <h3 style={{ margin: "6px 0 0" }}>{summary?.forProfitEligible ?? 0}</h3>
        </div>
        <div className="card">
          <p className="muted">Analyzed w/ AI</p>
          <h3 style={{ margin: "6px 0 0" }}>{summary?.analyzed ?? 0}</h3>
        </div>
        <div className="card">
          <p className="muted">High feasibility</p>
          <h3 style={{ margin: "6px 0 0" }}>{summary?.highFeasibility ?? 0}</h3>
        </div>
        <div className="card">
          <p className="muted">Last update</p>
          <h3 style={{ margin: "6px 0 0" }}>{summary?.lastUpdated ?? "N/A"}</h3>
        </div>
        <div className="card" style={{ display: "grid", gap: "8px" }}>
          <p className="muted">Sync now</p>
          <form action={handleRunSync}>
            <button className="button" type="submit">
              Sync All Sources
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>High-signal opportunities</h3>
        <OpportunityList items={highSignal} />
      </div>
    </section>
  );
}

function SourcesTab({
  sources,
  warning
}: {
  sources: Awaited<ReturnType<typeof fetchFundingSources>>["sources"];
  warning?: string;
}) {
  const filteredSources = sources.slice();

  async function handleSourceSync(formData: FormData) {
    "use server";
    const sourceId = String(formData.get("sourceId") ?? "").trim();
    const url = String(formData.get("url") ?? "").trim();
    const maxNotices = Number(formData.get("maxNotices") ?? "");
    if (!sourceId) return;
    await syncFundingSource(sourceId, {
      url: url || undefined,
      maxNotices: Number.isNaN(maxNotices) ? undefined : maxNotices
    });
    revalidatePath("/admin?tab=sources");
  }

  async function handleSourceUpdate(formData: FormData) {
    "use server";
    const sourceId = String(formData.get("sourceId") ?? "").trim();
    const autoUrl = String(formData.get("autoUrl") ?? "").trim();
    const integrationType = String(formData.get("integrationType") ?? "").trim();
    const active = formData.get("active") === "on";
    if (!sourceId) return;
    await updateFundingSource(sourceId, {
      integrationType: integrationType as "core_api" | "ted_xml_zip" | "bulk_xml_zip" | "bulk_xml" | "bulk_json" | "manual_url",
      autoUrl: autoUrl ? autoUrl : null,
      active
    });
    revalidatePath("/admin?tab=sources");
  }

  async function handleSourceToggle(formData: FormData) {
    "use server";
    const sourceId = String(formData.get("sourceId") ?? "").trim();
    const active = String(formData.get("active") ?? "") === "true";
    if (!sourceId) return;
    await updateFundingSource(sourceId, { active });
    revalidatePath("/admin?tab=sources");
  }

  async function handleRowSync(formData: FormData) {
    "use server";
    const sourceId = String(formData.get("sourceId") ?? "").trim();
    const maxNotices = Number(formData.get("maxNotices") ?? "");
    if (!sourceId) return;
    await syncFundingSource(sourceId, {
      maxNotices: Number.isNaN(maxNotices) ? undefined : maxNotices
    });
    revalidatePath("/admin?tab=sources");
  }

  const activeCount = sources.filter((source) => source.active).length;
  const failedCount = sources.filter((source) => source.lastStatus === "failed").length;
  const bulkCount = sources.filter((source) =>
    ["bulk_xml_zip", "bulk_xml", "bulk_json"].includes(source.integrationType)
  ).length;

  return (
    <section className="grid" style={{ gap: "12px" }}>
      {warning ? (
        <div className="card card--flat" style={{ background: "#fef3c7", color: "#92400e", padding: "12px 16px", marginBottom: "0" }}>
          {warning}
        </div>
      ) : null}

      <div className="grid grid-4" style={{ gap: "8px" }}>
        <div className="card" style={{ padding: "12px 16px" }}>
          <p className="muted" style={{ fontSize: "11px", margin: "0 0 4px" }}>Total sources</p>
          <h3 style={{ margin: 0, fontSize: "20px" }}>{sources.length}</h3>
        </div>
        <div className="card" style={{ padding: "12px 16px" }}>
          <p className="muted" style={{ fontSize: "11px", margin: "0 0 4px" }}>Active sources</p>
          <h3 style={{ margin: 0, fontSize: "20px" }}>{activeCount}</h3>
        </div>
        <div className="card" style={{ padding: "12px 16px" }}>
          <p className="muted" style={{ fontSize: "11px", margin: "0 0 4px" }}>Bulk integrations</p>
          <h3 style={{ margin: 0, fontSize: "20px" }}>{bulkCount}</h3>
        </div>
        <div className="card" style={{ padding: "12px 16px" }}>
          <p className="muted" style={{ fontSize: "11px", margin: "0 0 4px" }}>Failed syncs</p>
          <h3 style={{ margin: 0, fontSize: "20px" }}>{failedCount}</h3>
        </div>
      </div>

      <div className="grid grid-2" style={{ gap: "12px" }}>
        <div className="card" style={{ padding: "16px" }}>
          <h3 style={{ marginTop: 0, marginBottom: "12px", fontSize: "16px" }}>Manual import</h3>
          <form className="grid" action={handleSourceSync} style={{ gap: "8px" }}>
            <label style={{ display: "grid", gap: "4px" }}>
              <span className="pill" style={{ fontSize: "11px", padding: "4px 8px" }}>Source</span>
              <select className="select" name="sourceId" style={{ padding: "8px 10px", fontSize: "13px" }}>
                {sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "grid", gap: "4px" }}>
              <span className="pill" style={{ fontSize: "11px", padding: "4px 8px" }}>Download URL override</span>
              <input className="input" name="url" placeholder="https://example.com/export.zip" style={{ padding: "8px 10px", fontSize: "13px" }} />
            </label>
            <label style={{ display: "grid", gap: "4px" }}>
              <span className="pill" style={{ fontSize: "11px", padding: "4px 8px" }}>Max notices</span>
              <input className="input" name="maxNotices" placeholder="500" style={{ padding: "8px 10px", fontSize: "13px" }} />
            </label>
            <button className="button" type="submit" style={{ padding: "8px 14px", fontSize: "13px", marginTop: "4px" }}>
              Run import
            </button>
          </form>
        </div>

        <div className="card" style={{ padding: "16px" }}>
          <h3 style={{ marginTop: 0, marginBottom: "12px", fontSize: "16px" }}>Automation settings</h3>
          <form className="grid" action={handleSourceUpdate} style={{ gap: "8px" }}>
            <label style={{ display: "grid", gap: "4px" }}>
              <span className="pill" style={{ fontSize: "11px", padding: "4px 8px" }}>Source</span>
              <select className="select" name="sourceId" style={{ padding: "8px 10px", fontSize: "13px" }}>
                {sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "grid", gap: "4px" }}>
              <span className="pill" style={{ fontSize: "11px", padding: "4px 8px" }}>Integration type</span>
              <select className="select" name="integrationType" defaultValue="manual_url" style={{ padding: "8px 10px", fontSize: "13px" }}>
                {INTEGRATION_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "grid", gap: "4px" }}>
              <span className="pill" style={{ fontSize: "11px", padding: "4px 8px" }}>Auto URL</span>
              <input className="input" name="autoUrl" placeholder="https://example.com/daily.zip" style={{ padding: "8px 10px", fontSize: "13px" }} />
            </label>
            <label style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "4px" }}>
              <input type="checkbox" name="active" style={{ margin: 0 }} />
              <span className="pill" style={{ fontSize: "11px", padding: "4px 8px" }}>Enable cron sync</span>
            </label>
            <button className="button button--secondary" type="submit" style={{ padding: "8px 14px", fontSize: "13px", marginTop: "4px" }}>
              Save settings
            </button>
          </form>
        </div>
      </div>

      <div className="card" style={{ padding: "16px" }}>
        <h3 style={{ marginTop: 0, marginBottom: "12px", fontSize: "16px" }}>Source registry</h3>
        {filteredSources.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filteredSources.map((source) => (
              <details key={source.id} style={{ border: "1px solid var(--border)", borderRadius: "4px", padding: "10px 12px" }}>
                <summary style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", listStyle: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: "1", minWidth: "200px" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "2px" }}>{source.name}</div>
                      <div className="muted" style={{ fontSize: "11px" }}>
                        {source.country ?? "Global"} • {source.id}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                    <span className="pill" style={{ fontSize: "10px", padding: "3px 8px" }}>{source.integrationType}</span>
                    <span className={`badge badge--${source.active ? "good" : "muted"}`} style={{ fontSize: "10px", padding: "3px 8px" }}>
                      {source.active ? "Active" : "Inactive"}
                    </span>
                    <span
                      className={`badge badge--${
                        source.lastStatus === "failed" ? "low" : source.lastStatus === "success" ? "good" : "muted"
                      }`}
                      style={{ fontSize: "10px", padding: "3px 8px" }}
                    >
                      {source.lastStatus ?? "No status"}
                    </span>
                  </div>
                </summary>
                <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
                  <div className="grid grid-4" style={{ gap: "12px", marginBottom: "12px" }}>
                    <div>
                      <p className="muted" style={{ fontSize: "10px", margin: "0 0 4px" }}>Auto URL</p>
                      <p style={{ margin: 0, fontSize: "12px", wordBreak: "break-word" }}>{source.autoUrl ?? "Not set"}</p>
                    </div>
                    <div>
                      <p className="muted" style={{ fontSize: "10px", margin: "0 0 4px" }}>Last sync</p>
                      <p style={{ margin: 0, fontSize: "12px" }}>{source.lastSync ?? "—"}</p>
                    </div>
                    <div>
                      <p className="muted" style={{ fontSize: "10px", margin: "0 0 4px" }}>Last ingested</p>
                      <p style={{ margin: 0, fontSize: "12px" }}>{source.lastIngested ?? 0}</p>
                    </div>
                    <div>
                      <p className="muted" style={{ fontSize: "10px", margin: "0 0 4px" }}>Expected volume</p>
                      <p style={{ margin: 0, fontSize: "12px" }}>{source.expectedResults ?? "—"}</p>
                    </div>
                    <div>
                      <p className="muted" style={{ fontSize: "10px", margin: "0 0 4px" }}>Homepage</p>
                      {source.homepage ? (
                        <a href={source.homepage} target="_blank" rel="noreferrer" style={{ color: "var(--primary)", fontSize: "12px" }}>
                          Visit portal
                        </a>
                      ) : (
                        <p style={{ margin: 0, fontSize: "12px" }}>—</p>
                      )}
                    </div>
                    <div>
                      <p className="muted" style={{ fontSize: "10px", margin: "0 0 4px" }}>Last error</p>
                      <p style={{ margin: 0, fontSize: "12px", wordBreak: "break-word" }}>{source.lastError ?? "—"}</p>
                    </div>
                  </div>
                  <div className="grid grid-3" style={{ gap: "10px" }}>
                    <form action={handleRowSync} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <input type="hidden" name="sourceId" value={source.id} />
                      <label style={{ display: "grid", gap: "4px" }}>
                        <span className="pill" style={{ fontSize: "10px", padding: "3px 8px" }}>Max notices</span>
                        <input className="input" name="maxNotices" placeholder="500" style={{ padding: "6px 8px", fontSize: "12px" }} />
                      </label>
                      <button className="button" type="submit" style={{ padding: "6px 12px", fontSize: "12px" }}>
                        Sync now
                      </button>
                    </form>
                    <form action={handleSourceUpdate} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <input type="hidden" name="sourceId" value={source.id} />
                      <label style={{ display: "grid", gap: "4px" }}>
                        <span className="pill" style={{ fontSize: "10px", padding: "3px 8px" }}>Integration type</span>
                        <select className="select" name="integrationType" defaultValue={source.integrationType} style={{ padding: "6px 8px", fontSize: "12px" }}>
                          {INTEGRATION_TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label style={{ display: "grid", gap: "4px" }}>
                        <span className="pill" style={{ fontSize: "10px", padding: "3px 8px" }}>Auto URL</span>
                        <input className="input" name="autoUrl" defaultValue={source.autoUrl ?? ""} style={{ padding: "6px 8px", fontSize: "12px" }} />
                      </label>
                      <label style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <input type="checkbox" name="active" defaultChecked={source.active} style={{ margin: 0 }} />
                        <span className="pill" style={{ fontSize: "10px", padding: "3px 8px" }}>Enable cron</span>
                      </label>
                      <button className="button button--secondary" type="submit" style={{ padding: "6px 12px", fontSize: "12px" }}>
                        Save settings
                      </button>
                    </form>
                    <form action={handleSourceToggle} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <input type="hidden" name="sourceId" value={source.id} />
                      <input type="hidden" name="active" value={source.active ? "false" : "true"} />
                      <div>
                        <p className="muted" style={{ fontSize: "10px", margin: "0 0 6px" }}>Quick toggle</p>
                        <button className="button button--secondary" type="submit" style={{ padding: "6px 12px", fontSize: "12px", width: "100%" }}>
                          {source.active ? "Disable source" : "Enable source"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </details>
            ))}
          </div>
        ) : (
          <p className="muted" style={{ fontSize: "13px" }}>No sources configured yet. Seed the registry in D1 to get started.</p>
        )}
      </div>
    </section>
  );
}

function ExclusionsTab({
  rules,
  warning
}: {
  rules: Awaited<ReturnType<typeof fetchExclusionRules>>["rules"];
  warning?: string;
}) {
  async function handleAddRule(formData: FormData) {
    "use server";
    const ruleType = String(formData.get("ruleType") ?? "");
    const value = String(formData.get("value") ?? "").trim();
    if (!ruleType || !value) return;
    await createExclusionRule(ruleType as "excluded_bureau" | "priority_agency", value);
    revalidatePath("/admin");
  }

  async function handleDisableRule(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "");
    if (!id) return;
    await disableExclusionRule(id);
    revalidatePath("/admin");
  }

  return (
    <section className="grid">
      {warning ? (
        <div className="card card--flat" style={{ background: "#fef3c7", color: "#92400e" }}>
          {warning}
        </div>
      ) : null}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Add Filter</h3>
        <form className="grid" action={handleAddRule}>
          <label style={{ display: "grid", gap: "6px" }}>
            <span className="pill">Filter type</span>
            <select className="select" name="ruleType" defaultValue="excluded_bureau">
              <option value="excluded_bureau">Exclude bureau/agency</option>
              <option value="priority_agency">Priority agency</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: "6px" }}>
            <span className="pill">Value</span>
            <input className="input" name="value" placeholder="e.g. USDA, Forestry" />
          </label>
          <button className="button" type="submit">
            Add Filter
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Active Filters</h3>
        {rules.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Value</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td>{rule.ruleType === "excluded_bureau" ? "Exclude bureau" : "Priority agency"}</td>
                  <td>{rule.value}</td>
                  <td>{rule.createdAt}</td>
                  <td>
                    <form action={handleDisableRule}>
                      <input type="hidden" name="id" value={rule.id} />
                      <button className="button button--secondary" type="submit">
                        Disable
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">No filters configured.</p>
        )}
      </div>
    </section>
  );
}

function SettingsTab() {
  // Import at the top of the file would be better, but this works for now
  const apiUrl = typeof process !== 'undefined' && process.env
    ? (process.env.GRANT_SENTINEL_API_URL ?? process.env.NEXT_PUBLIC_GRANT_SENTINEL_API_URL ?? 'https://grant-sentinel.wakas.workers.dev')
    : 'https://grant-sentinel.wakas.workers.dev';

  return (
    <section className="grid">
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Environment status</h3>
        <div className="grid grid-2">
          <div>
            <p className="muted">Worker API</p>
            <p style={{ marginTop: "6px" }}>{apiUrl ?? "Not configured"}</p>
          </div>
          <div>
            <p className="muted">Secrets</p>
            <p style={{ marginTop: "6px" }}>
              Configure API keys, webhook URLs, and company profile via Wrangler secrets.
            </p>
          </div>
        </div>
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Recommended next steps</h3>
        <ol className="muted">
          <li>Set GRANT_SENTINEL_API_URL for this dashboard.</li>
          <li>Populate D1 with schema and run the ingestion cron.</li>
          <li>Configure daily brief webhooks for high-feasibility alerts.</li>
        </ol>
      </div>
    </section>
  );
}
