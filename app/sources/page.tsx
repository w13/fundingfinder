import { fetchFundingSources, syncFundingSource, updateFundingSource } from "../../lib/admin";
import { revalidatePath } from "next/cache";

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
  const sourcesResult = await fetchFundingSources();
  const sources = sourcesResult.sources;

  async function handleSync(formData: FormData) {
    "use server";
    const sourceId = String(formData.get("sourceId") ?? "").trim();
    if (!sourceId) return;
    await syncFundingSource(sourceId, {});
    revalidatePath("/sources");
  }

  async function handleToggle(formData: FormData) {
    "use server";
    const sourceId = String(formData.get("sourceId") ?? "").trim();
    const active = String(formData.get("active") ?? "") === "true";
    if (!sourceId) return;
    await updateFundingSource(sourceId, { active });
    revalidatePath("/sources");
  }

  const sortedSources = [...sources].sort((a, b) => {
    // Sort by active first, then by name
    if (a.active !== b.active) return a.active ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="grid">
      <section className="hero">
        <p className="pill">Data Sources</p>
        <h2 className="hero__title">Source Status & Management</h2>
        <p className="hero__subtitle">
          Monitor sync status, configure automation, and manually trigger imports for all funding sources.
        </p>
        {sourcesResult.warning ? (
          <div className="card card--flat" style={{ background: "#fef3c7", color: "#92400e" }}>
            {sourcesResult.warning}
          </div>
        ) : null}
      </section>

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
                
                const formatDate = (dateStr: string | null) => {
                  if (!dateStr) return "—";
                  const date = new Date(dateStr);
                  const now = new Date();
                  const diffMs = now.getTime() - date.getTime();
                  const diffMins = Math.floor(diffMs / 60000);
                  const diffHours = Math.floor(diffMs / 3600000);
                  const diffDays = Math.floor(diffMs / 86400000);
                  
                  if (diffMins < 1) return "Just now";
                  if (diffMins < 60) return `${diffMins}m ago`;
                  if (diffHours < 24) return `${diffHours}h ago`;
                  if (diffDays < 7) return `${diffDays}d ago`;
                  return date.toLocaleDateString();
                };

                return (
                  <tr key={source.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 8px", textAlign: "center" }}>
                      <div
                        style={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          backgroundColor: statusColor,
                          display: "inline-block",
                          boxShadow: status === "syncing" ? `0 0 8px ${statusColor}` : "none",
                          animation: status === "syncing" ? "pulse 2s infinite" : "none"
                        }}
                        title={statusLabel}
                      />
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "2px" }}>
                        {source.name}
                      </div>
                      <div className="muted" style={{ fontSize: "11px" }}>
                        {source.country ?? "Global"} • {source.id}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: "13px", fontWeight: 500, color: statusColor }}>
                        {statusLabel}
                      </div>
                      {source.lastError && status === "failed" && (
                        <div className="muted" style={{ fontSize: "11px", marginTop: "2px" }}>
                          {source.lastError.length > 50 ? `${source.lastError.substring(0, 50)}...` : source.lastError}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "13px" }}>
                      {formatDate(source.lastSync)}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontSize: "13px", fontWeight: 500 }}>
                      {source.lastIngested.toLocaleString()}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span className="pill" style={{ fontSize: "10px", padding: "3px 8px" }}>
                        {source.integrationType}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" }}>
                        <form action={handleSync} style={{ margin: 0 }}>
                          <input type="hidden" name="sourceId" value={source.id} />
                          <button
                            className="button"
                            type="submit"
                            style={{ padding: "4px 10px", fontSize: "11px", whiteSpace: "nowrap" }}
                          >
                            Sync
                          </button>
                        </form>
                        <form action={handleToggle} style={{ margin: 0 }}>
                          <input type="hidden" name="sourceId" value={source.id} />
                          <input type="hidden" name="active" value={source.active ? "false" : "true"} />
                          <button
                            className="button button--secondary"
                            type="submit"
                            style={{ padding: "4px 10px", fontSize: "11px", whiteSpace: "nowrap" }}
                          >
                            {source.active ? "Disable" : "Enable"}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
