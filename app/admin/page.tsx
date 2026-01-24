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
  searchParams?: Record<string, string | string[] | undefined>;
};

const VALID_TABS = ["overview", "sources", "exclusions", "settings"];

export default async function AdminPage({ searchParams }: PageProps) {
  const tabParam = typeof searchParams?.tab === "string" ? searchParams.tab : "overview";
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
        <p className="pill">Admin Control Panel</p>
        <h2 className="hero__title">Operational controls & oversight</h2>
        <p className="hero__subtitle">
          Manage ingestion rules, monitor source coverage, and trigger pipeline activity without leaving the dashboard.
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
          <p className="muted">Manual sync</p>
          <form action={handleRunSync}>
            <button className="button" type="submit">
              Run ingestion pipeline
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
    <section className="grid">
      {warning ? (
        <div className="card card--flat" style={{ background: "#fef3c7", color: "#92400e" }}>
          {warning}
        </div>
      ) : null}

      <div className="grid grid-3">
        <div className="card">
          <p className="muted">Total sources</p>
          <h3 style={{ margin: "6px 0 0" }}>{sources.length}</h3>
        </div>
        <div className="card">
          <p className="muted">Active sources</p>
          <h3 style={{ margin: "6px 0 0" }}>{activeCount}</h3>
        </div>
        <div className="card">
          <p className="muted">Bulk integrations</p>
          <h3 style={{ margin: "6px 0 0" }}>{bulkCount}</h3>
        </div>
        <div className="card">
          <p className="muted">Failed syncs</p>
          <h3 style={{ margin: "6px 0 0" }}>{failedCount}</h3>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Manual import</h3>
          <form className="grid" action={handleSourceSync}>
            <label style={{ display: "grid", gap: "6px" }}>
              <span className="pill">Source</span>
              <select className="select" name="sourceId">
                {sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "grid", gap: "6px" }}>
              <span className="pill">Download URL override</span>
              <input className="input" name="url" placeholder="https://example.com/export.zip" />
            </label>
            <label style={{ display: "grid", gap: "6px" }}>
              <span className="pill">Max notices</span>
              <input className="input" name="maxNotices" placeholder="500" />
            </label>
            <button className="button" type="submit">
              Run import
            </button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Automation settings</h3>
          <form className="grid" action={handleSourceUpdate}>
            <label style={{ display: "grid", gap: "6px" }}>
              <span className="pill">Source</span>
              <select className="select" name="sourceId">
                {sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "grid", gap: "6px" }}>
              <span className="pill">Integration type</span>
              <select className="select" name="integrationType" defaultValue="manual_url">
                {INTEGRATION_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "grid", gap: "6px" }}>
              <span className="pill">Auto URL</span>
              <input className="input" name="autoUrl" placeholder="https://example.com/daily.zip" />
            </label>
            <label style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input type="checkbox" name="active" />
              <span className="pill">Enable cron sync</span>
            </label>
            <button className="button button--secondary" type="submit">
              Save settings
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Source registry</h3>
        {filteredSources.length ? (
          <div className="grid">
            {filteredSources.map((source) => (
              <div key={source.id} className="card card--flat">
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                  <div>
                    <h4 style={{ margin: 0 }}>{source.name}</h4>
                    <p className="muted" style={{ margin: "6px 0 0" }}>
                      {source.country ?? "Global"} - {source.id}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <span className="pill">{source.integrationType}</span>
                    <span className={`badge badge--${source.active ? "good" : "muted"}`}>
                      {source.active ? "Active" : "Inactive"}
                    </span>
                    <span
                      className={`badge badge--${
                        source.lastStatus === "failed" ? "low" : source.lastStatus === "success" ? "good" : "muted"
                      }`}
                    >
                      {source.lastStatus ?? "No status"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-3" style={{ marginTop: "16px" }}>
                  <div>
                    <p className="muted">Auto URL</p>
                    <p style={{ margin: 0 }}>{source.autoUrl ?? "Not set"}</p>
                  </div>
                  <div>
                    <p className="muted">Last sync</p>
                    <p style={{ margin: 0 }}>{source.lastSync ?? "—"}</p>
                  </div>
                  <div>
                    <p className="muted">Last ingested</p>
                    <p style={{ margin: 0 }}>{source.lastIngested ?? 0}</p>
                  </div>
                  <div>
                    <p className="muted">Expected volume</p>
                    <p style={{ margin: 0 }}>{source.expectedResults ?? "—"}</p>
                  </div>
                  <div>
                    <p className="muted">Homepage</p>
                    {source.homepage ? (
                      <a href={source.homepage} target="_blank" rel="noreferrer" style={{ color: "var(--primary)" }}>
                        Visit portal
                      </a>
                    ) : (
                      <p style={{ margin: 0 }}>—</p>
                    )}
                  </div>
                  <div>
                    <p className="muted">Last error</p>
                    <p style={{ margin: 0 }}>{source.lastError ?? "—"}</p>
                  </div>
                </div>

                <div className="grid grid-3" style={{ marginTop: "16px" }}>
                  <form className="grid" action={handleRowSync}>
                    <input type="hidden" name="sourceId" value={source.id} />
                    <label style={{ display: "grid", gap: "6px" }}>
                      <span className="pill">Max notices</span>
                      <input className="input" name="maxNotices" placeholder="500" />
                    </label>
                    <button className="button" type="submit">
                      Sync now
                    </button>
                  </form>

                  <form className="grid" action={handleSourceUpdate}>
                    <input type="hidden" name="sourceId" value={source.id} />
                    <label style={{ display: "grid", gap: "6px" }}>
                      <span className="pill">Integration type</span>
                      <select className="select" name="integrationType" defaultValue={source.integrationType}>
                        {INTEGRATION_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label style={{ display: "grid", gap: "6px" }}>
                      <span className="pill">Auto URL</span>
                      <input className="input" name="autoUrl" defaultValue={source.autoUrl ?? ""} />
                    </label>
                    <label style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <input type="checkbox" name="active" defaultChecked={source.active} />
                      <span className="pill">Enable cron sync</span>
                    </label>
                    <button className="button button--secondary" type="submit">
                      Save settings
                    </button>
                  </form>

                  <form className="grid" action={handleSourceToggle}>
                    <input type="hidden" name="sourceId" value={source.id} />
                    <input type="hidden" name="active" value={source.active ? "false" : "true"} />
                    <div>
                      <p className="muted">Quick toggle</p>
                      <button className="button button--secondary" type="submit">
                        {source.active ? "Disable source" : "Enable source"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">No sources configured yet. Seed the registry in D1 to get started.</p>
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
        <h3 style={{ marginTop: 0 }}>Add rule</h3>
        <form className="grid" action={handleAddRule}>
          <label style={{ display: "grid", gap: "6px" }}>
            <span className="pill">Rule type</span>
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
            Save rule
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Active rules</h3>
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
          <p className="muted">No exclusion rules configured.</p>
        )}
      </div>
    </section>
  );
}

function SettingsTab() {
  const apiUrl = process.env.GRANT_SENTINEL_API_URL ?? process.env.NEXT_PUBLIC_GRANT_SENTINEL_API_URL;

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
