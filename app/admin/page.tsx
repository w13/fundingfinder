import Link from "next/link";
import WarningBanner from "../../components/WarningBanner";
import SourcePipelinePanel from "../../components/admin/SourcePipelinePanel";
import NotificationChannelsPanel from "../../components/admin/NotificationChannelsPanel";
import SearchBoostsPanel from "../../components/admin/SearchBoostsPanel";
import { fetchAdminSetup, fetchDiagnostics, fetchFailedJobs, fetchNotificationChannels, fetchSearchBoosts } from "../../lib/api/admin";
import { fetchSearchAnalytics } from "../../lib/api/search";
import { isReadOnlyMode, getApiBaseUrl } from "../../lib/domain/constants";
import { logServerError } from "../../lib/errors/serverErrorLogger";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const readOnly = isReadOnlyMode();
  const apiUrl = process.env.GRANT_SENTINEL_API_URL ?? process.env.NEXT_PUBLIC_GRANT_SENTINEL_API_URL ?? getApiBaseUrl();

  const [setupResult, notificationsResult, boostsResult, analyticsResult, diagnosticsResult, failedResult] = await Promise.all([
    fetchAdminSetup().catch((error) => {
      logServerError(error, { component: "AdminPage", action: "fetchAdminSetup" });
      return { adminKeyConfigured: false, warning: "Failed to load admin setup" };
    }),
    fetchNotificationChannels().catch((error) => {
      logServerError(error, { component: "AdminPage", action: "fetchNotificationChannels" });
      return { channels: [], warning: "Failed to load notification channels" };
    }),
    fetchSearchBoosts().catch((error) => {
      logServerError(error, { component: "AdminPage", action: "fetchSearchBoosts" });
      return { boosts: [], warning: "Failed to load search boosts" };
    }),
    fetchSearchAnalytics().catch((error) => {
      logServerError(error, { component: "AdminPage", action: "fetchSearchAnalytics" });
      return { analytics: null, warning: "Failed to load search analytics" };
    }),
    fetchDiagnostics().catch((error) => {
      logServerError(error, { component: "AdminPage", action: "fetchDiagnostics" });
      return { diagnostics: [], warning: "Failed to load diagnostics" };
    }),
    fetchFailedJobs().catch((error) => {
      logServerError(error, { component: "AdminPage", action: "fetchFailedJobs" });
      return { failed: [], warning: "Failed to load failed jobs" };
    })
  ]);

  const warnings = [
    setupResult.warning,
    notificationsResult.warning,
    boostsResult.warning,
    analyticsResult.warning,
    diagnosticsResult.warning,
    failedResult.warning
  ].filter(Boolean);

  return (
    <div className="grid">
      <section className="hero">
        <h2 className="hero__title">Admin setup</h2>
        <p className="hero__subtitle">Operational controls, notifications, and diagnostics.</p>
        <WarningBanner warnings={warnings} />
      </section>

      <div className="grid grid-2" style={{ marginBottom: "24px" }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Setup checklist</h3>
          <ul style={{ margin: 0, paddingLeft: "20px", lineHeight: "1.8" }}>
            <li>API endpoint: <span className="pill">{apiUrl}</span></li>
            <li>Admin API key: {setupResult.adminKeyConfigured ? "Configured" : "Missing"}</li>
            <li>Read-only mode: {readOnly ? "Enabled" : "Disabled"}</li>
          </ul>
          {!setupResult.adminKeyConfigured && (
            <div style={{ marginTop: "12px", fontSize: "13px", color: "#b45309" }}>
              Admin actions require <code>ADMIN_API_KEY</code>. Set it with <code>wrangler secret put ADMIN_API_KEY</code>.
            </div>
          )}
          <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <Link className="button button--secondary button--small" href="/sources">
              Go to Sources
            </Link>
            <Link className="button button--secondary button--small" href="/status">
              View status page
            </Link>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Recent failures</h3>
          {failedResult.failed.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>No failed jobs recorded.</p>
          ) : (
            <div style={{ display: "grid", gap: "8px" }}>
              {failedResult.failed.slice(0, 5).map((job) => (
                <div key={job.id} style={{ padding: "10px 12px", border: "1px solid var(--border-light)", background: "#fff" }}>
                  <div style={{ fontWeight: 600, fontSize: "13px" }}>{job.jobType}</div>
                  <div className="muted" style={{ fontSize: "12px" }}>
                    {job.error ?? "Unknown error"} · attempts {job.attempts}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <SourcePipelinePanel readOnly={readOnly} />

      <div className="grid grid-2" style={{ marginTop: "24px" }}>
        <NotificationChannelsPanel initialChannels={notificationsResult.channels} readOnly={readOnly} />
        <SearchBoostsPanel initialBoosts={boostsResult.boosts} readOnly={readOnly} />
      </div>

      <div className="grid grid-2" style={{ marginTop: "24px" }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Search analytics</h3>
          {analyticsResult.analytics ? (
            <div className="grid grid-2" style={{ gap: "12px" }}>
              <div>
                <h4 style={{ margin: "0 0 8px" }}>Top queries</h4>
                <ul style={{ margin: 0, paddingLeft: "18px" }}>
                  {analyticsResult.analytics.topQueries.map((item, index) => (
                    <li key={`${item.query ?? "unknown"}-${index}`} style={{ fontSize: "13px" }}>
                      {item.query ?? "Unknown"} · {item.clicks}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 style={{ margin: "0 0 8px" }}>Top sources</h4>
                <ul style={{ margin: 0, paddingLeft: "18px" }}>
                  {analyticsResult.analytics.topSources.map((item) => (
                    <li key={item.source} style={{ fontSize: "13px" }}>
                      {item.source} · {item.clicks}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="muted" style={{ margin: 0 }}>No analytics captured yet.</p>
          )}
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Normalization diagnostics</h3>
          {diagnosticsResult.diagnostics.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>No diagnostics captured yet.</p>
          ) : (
            <div style={{ display: "grid", gap: "8px" }}>
              {diagnosticsResult.diagnostics.map((diag) => (
                <div key={diag.source} style={{ padding: "10px 12px", border: "1px solid var(--border-light)", background: "#fff" }}>
                  <div style={{ fontWeight: 600, fontSize: "13px" }}>{diag.source}</div>
                  <div className="muted" style={{ fontSize: "12px" }}>
                    Missing fields: {Object.keys(diag.missingCounts).slice(0, 4).join(", ") || "None"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import { redirect } from "next/navigation";

export default function AdminPage() {
  redirect("/sources");
}
