import { revalidatePath } from "next/cache";
import TabNav from "../../components/admin/TabNav";
import OpportunityList from "../../components/OpportunityList";
import {
  fetchAdminSummary,
  fetchExclusionRules,
  createExclusionRule,
  disableExclusionRule,
  triggerIngestionSync,
  triggerTedSync
} from "../../lib/admin";
import { fetchOpportunities } from "../../lib/opportunities";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const VALID_TABS = ["overview", "sources", "exclusions", "settings"];

export default async function AdminPage({ searchParams }: PageProps) {
  const tabParam = typeof searchParams?.tab === "string" ? searchParams.tab : "overview";
  const activeTab = VALID_TABS.includes(tabParam) ? tabParam : "overview";

  const [summaryResult, exclusionsResult, highSignal] = await Promise.all([
    fetchAdminSummary(),
    fetchExclusionRules(),
    fetchOpportunities({ minScore: "75", limit: 5 })
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
      {activeTab === "sources" ? <SourcesTab summary={summaryResult.summary} /> : null}
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

  async function handleRunTedSync(formData: FormData) {
    "use server";
    const zipUrl = String(formData.get("zipUrl") ?? "").trim();
    await triggerTedSync(zipUrl || undefined);
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
        <div className="card" style={{ display: "grid", gap: "8px" }}>
          <p className="muted">TED bulk import</p>
          <form action={handleRunTedSync} className="grid">
            <input className="input" name="zipUrl" placeholder="Optional TED zip URL override" />
            <button className="button button--secondary" type="submit">
              Run TED import
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

function SourcesTab({ summary }: { summary: Awaited<ReturnType<typeof fetchAdminSummary>>["summary"] }) {
  return (
    <section className="card">
      <h3 style={{ marginTop: 0 }}>Source coverage</h3>
      {summary?.sources?.length ? (
        <table className="table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Total</th>
              <th>For-profit</th>
              <th>Last updated</th>
            </tr>
          </thead>
          <tbody>
            {summary.sources.map((source) => (
              <tr key={source.source}>
                <td>{source.source.replace("_", ".")}</td>
                <td>{source.total}</td>
                <td>{source.forProfitEligible}</td>
                <td>{source.lastUpdated ?? "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="muted">No source data available yet.</p>
      )}
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
