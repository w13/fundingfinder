import WarningBanner from "../../components/WarningBanner";
import { fetchHealthStatus } from "../../lib/api/health";
import { logServerError } from "../../lib/errors/serverErrorLogger";

export const dynamic = "force-dynamic";

export default async function StatusPage() {
  const healthResult = await fetchHealthStatus().catch((error) => {
    logServerError(error, { component: "StatusPage", action: "fetchHealthStatus" });
    return { health: null, warning: "Failed to load health status" };
  });

  return (
    <div className="grid">
      <section className="hero">
        <h2 className="hero__title">System status</h2>
        <p className="hero__subtitle">Live health checks for core infrastructure.</p>
        <WarningBanner warnings={healthResult.warning} />
      </section>

      {healthResult.health ? (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ margin: 0 }}>Overall status</h3>
            <span className="pill" style={{ background: healthResult.health.status === "ok" ? "#d1fae5" : "#fee2e2", color: healthResult.health.status === "ok" ? "#065f46" : "#991b1b" }}>
              {healthResult.health.status}
            </span>
          </div>
          <div style={{ display: "grid", gap: "8px" }}>
            {Object.entries(healthResult.health.checks ?? {}).map(([key, check]) => (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", border: "1px solid var(--border-light)" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "13px" }}>{key.toUpperCase()}</div>
                  <div className="muted" style={{ fontSize: "12px" }}>
                    {check.message ?? (check.ok ? "Healthy" : "Issue detected")}
                  </div>
                </div>
                <span className="pill" style={{ background: check.ok ? "#d1fae5" : "#fee2e2", color: check.ok ? "#065f46" : "#991b1b" }}>
                  {check.ok ? "OK" : "Fail"}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>Health status not available.</p>
        </div>
      )}
    </div>
  );
}
