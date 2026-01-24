import Link from "next/link";
import { revalidatePath } from "next/cache";
import { ScoreBadge } from "../../components/ScoreBadge";
import { analyzeShortlist, fetchShortlist, removeShortlist } from "../../lib/shortlist";
import { formatSourceLabel } from "../../lib/format";

export default async function ShortlistPage() {
  const { items, warning } = await fetchShortlist();

  async function handleAnalyze() {
    "use server";
    await analyzeShortlist();
    revalidatePath("/shortlist");
  }

  async function handleRemove(formData: FormData) {
    "use server";
    const shortlistId = String(formData.get("shortlistId") ?? "").trim();
    if (!shortlistId) return;
    await removeShortlist(shortlistId);
    revalidatePath("/shortlist");
  }

  return (
    <div className="grid">
      <section className="hero">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
          <div>
            <h2 className="hero__title" style={{ margin: 0, marginBottom: "8px" }}>AI Analysis</h2>
            <p className="hero__subtitle" style={{ margin: 0 }}>Analyze and score shortlisted opportunities</p>
          </div>
          <form action={handleAnalyze} style={{ margin: 0 }}>
            <button className="button" type="submit">
              Analyze shortlist
            </button>
          </form>
        </div>
        {warning ? (
          <div className="card card--flat" style={{ background: "#fef3c7", color: "#92400e", padding: "12px 16px", marginBottom: "24px" }}>
            {warning}
          </div>
        ) : null}
      </section>

      <div className="card" style={{ marginBottom: "24px" }}>
        <h3 style={{ margin: 0, marginBottom: "8px" }}>Shortlisted grants</h3>
        <p className="muted" style={{ margin: 0 }}>
          {items.length} opportunities ready for analysis.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="card">
          <p style={{ margin: 0 }}>
            No opportunities shortlisted yet. Visit the{" "}
            <Link href="/" style={{ color: "var(--primary)" }}>
              dashboard
            </Link>{" "}
            to add opportunities.
          </p>
        </div>
      ) : (
        <div className="grid">
          {items.map((item) => (
            <div key={item.shortlistId} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ margin: 0 }}>{item.title}</h3>
                  <p className="muted" style={{ margin: "6px 0 0" }}>
                    {item.agency ?? "Unknown agency"} - {formatSourceLabel(item.source)}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <ScoreBadge label="Feasibility" value={item.feasibilityScore} />
                  <ScoreBadge label="Suitability" value={item.suitabilityScore} />
                  <ScoreBadge label="Profitability" value={item.profitabilityScore} />
                </div>
              </div>
              <p style={{ margin: "12px 0 0" }}>{item.summary ?? "No summary available."}</p>
              <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#64748b", flexWrap: "wrap" }}>
                <span>Posted: {item.postedDate ?? "N/A"}</span>
                <span>Due: {item.dueDate ?? "N/A"}</span>
              </div>
              <div style={{ marginTop: "12px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <Link href={`/opportunities/${item.opportunityRecordId}`} className="button button--secondary">
                  View details
                </Link>
                <form action={handleRemove}>
                  <input type="hidden" name="shortlistId" value={item.shortlistId} />
                  <button className="button button--secondary" type="submit">
                    Remove
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
