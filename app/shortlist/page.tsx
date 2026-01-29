import Link from "next/link";
import { fetchShortlist } from "../../lib/api/shortlist";
import AnalyzeButton from "../../components/AnalyzeButton";
import ShortlistTable from "../../components/ShortlistTable";
import WarningBanner from "../../components/WarningBanner";
import { logServerError } from "../../lib/errors/serverErrorLogger";
import { handleAnalyze, handleBulkAnalyze, handleRemove } from "./actions";
import { isReadOnlyMode } from "../../lib/domain/constants";

// Force dynamic rendering to avoid static generation issues
export const dynamic = "force-dynamic";

export default async function ShortlistPage() {
  try {
    const { items, warning } = await fetchShortlist().catch((err) => {
      logServerError(err, { component: "ShortlistPage", action: "fetchShortlist" });
      return { items: [], warning: `Failed to load shortlist: ${err instanceof Error ? err.message : "Unknown error"}` };
    });

        const analyzedCount = items.filter((item) => item.analyzed).length;
  const unanalyzedCount = items.length - analyzedCount;
        const readOnly = isReadOnlyMode();

  return (
    <div>
      <section style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
          <div>
            <h2 style={{ margin: 0, marginBottom: "8px", fontSize: "24px", fontWeight: 600 }}>AI Analysis</h2>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "14px" }}>
              Analyze and score shortlisted opportunities using AI
            </p>
          </div>
          <AnalyzeButton action={handleAnalyze} itemCount={items.length} readOnly={readOnly} />
        </div>

        <WarningBanner warnings={warning} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
            marginBottom: "24px"
          }}
        >
          <div className="card" style={{ padding: "10px 12px" }}>
            <div style={{ fontSize: "9px", color: "var(--text-secondary)", marginBottom: "4px", textTransform: "uppercase", fontWeight: 600 }}>
              Total Opportunities
            </div>
            <div style={{ fontSize: "18px", fontWeight: 600 }}>{items.length}</div>
          </div>
          <div className="card" style={{ padding: "10px 12px" }}>
            <div style={{ fontSize: "9px", color: "var(--text-secondary)", marginBottom: "4px", textTransform: "uppercase", fontWeight: 600 }}>
              Analyzed
            </div>
            <div style={{ fontSize: "18px", fontWeight: 600 }}>{analyzedCount}</div>
          </div>
          <div className="card" style={{ padding: "10px 12px" }}>
            <div style={{ fontSize: "9px", color: "var(--text-secondary)", marginBottom: "4px", textTransform: "uppercase", fontWeight: 600 }}>
              Pending Analysis
            </div>
            <div style={{ fontSize: "18px", fontWeight: 600 }}>{unanalyzedCount}</div>
          </div>
        </div>
      </section>

      {items.length === 0 ? (
        <div className="card">
          <p style={{ margin: 0, color: "var(--text-secondary)" }}>
            No opportunities shortlisted yet. Visit the{" "}
            <Link href="/" style={{ color: "var(--primary)", textDecoration: "none" }}>
              dashboard
            </Link>{" "}
            to add opportunities to your shortlist.
          </p>
        </div>
      ) : (
        <ShortlistTable items={items} onRemove={handleRemove} onAnalyzeSelected={handleBulkAnalyze} readOnly={readOnly} />
      )}
    </div>
  );
  } catch (error) {
    logServerError(error, { component: "ShortlistPage", action: "render" });
    throw error; // Re-throw to let Next.js error boundary handle it
  }
}
