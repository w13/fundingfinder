import Link from "next/link";
import { revalidatePath } from "next/cache";
import { fetchOpportunityById } from "../../../lib/opportunities";
import { ScoreBadge } from "../../../components/ScoreBadge";
import { formatSourceLabel } from "../../../lib/format";
import { addShortlist } from "../../../lib/shortlist";

export default async function OpportunityPage({ params }: { params: { id: string } }) {
  const item = await fetchOpportunityById(params.id);

  async function handleShortlist() {
    "use server";
    if (!item) return;
    await addShortlist(item.opportunityId, item.source);
    revalidatePath(`/opportunities/${params.id}`);
    revalidatePath("/shortlist");
  }

  if (!item) {
    return (
      <div className="card">
        <p>Opportunity not found.</p>
        <Link href="/" style={{ color: "var(--primary)" }}>
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="grid">
      <Link href="/" style={{ color: "var(--primary)" }}>
        ← Back to dashboard
      </Link>
      <div className="card">
        <p className="pill" style={{ marginBottom: "8px" }}>
          {formatSourceLabel(item.source)}
        </p>
        <h2 style={{ margin: 0 }}>{item.title}</h2>
        <p className="muted" style={{ margin: "6px 0 0" }}>
          {item.agency ?? "Unknown agency"} · {formatSourceLabel(item.source)}
        </p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
          <ScoreBadge label="Feasibility" value={item.feasibilityScore} />
          <ScoreBadge label="Suitability" value={item.suitabilityScore ?? null} />
          <ScoreBadge label="Profitability" value={item.profitabilityScore} />
        </div>
        <form action={handleShortlist} style={{ marginTop: "12px" }}>
          <button className="button button--secondary" type="submit">
            Add to shortlist
          </button>
        </form>
      </div>

      <section className="card">
        <h3 style={{ margin: 0 }}>AI Feasibility Summary</h3>
        {item.analysisSummary.length > 0 ? (
          <ul>
            {item.analysisSummary.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            No AI summary available yet.
          </p>
        )}
      </section>

      <section className="card">
        <h3 style={{ margin: 0 }}>Key Constraints</h3>
        {item.constraints.length > 0 ? (
          <ul>
            {item.constraints.map((constraint) => (
              <li key={constraint}>{constraint}</li>
            ))}
          </ul>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            No constraints captured.
          </p>
        )}
      </section>

      <section className="card">
        <h3 style={{ margin: 0 }}>Eligibility</h3>
        <p className="muted" style={{ margin: 0 }}>
          {item.eligibility ?? "Not provided."}
        </p>
        <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "#64748b", flexWrap: "wrap" }}>
          <span>For-profit: {item.forProfitEligible ? "Yes" : "No"}</span>
          <span>Small business: {item.smallBusinessEligible ? "Yes" : "No"}</span>
        </div>
      </section>

      <section className="card">
        <h3 style={{ margin: 0 }}>Documents</h3>
        {item.documents.length > 0 ? (
          <div className="grid">
            {item.documents.map((doc) => (
              <div key={doc.id} className="card card--flat" style={{ padding: "16px" }}>
                <div style={{ fontSize: "12px", color: "#64748b" }}>R2 key: {doc.r2Key}</div>
                <a href={doc.documentUrl} target="_blank" rel="noreferrer" style={{ color: "var(--primary)" }}>
                  View source PDF
                </a>
                {doc.sectionMap ? (
                  <ul style={{ margin: "8px 0 0", color: "#64748b" }}>
                    <li>Program: {doc.sectionMap.programDescription ? "Captured" : "Missing"}</li>
                    <li>Requirements: {doc.sectionMap.requirements ? "Captured" : "Missing"}</li>
                    <li>Evaluation: {doc.sectionMap.evaluationCriteria ? "Captured" : "Missing"}</li>
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            No documents stored yet.
          </p>
        )}
      </section>

      {item.url ? (
        <section className="card">
          <h3 style={{ margin: 0 }}>Official Listing</h3>
          <a href={item.url} target="_blank" rel="noreferrer" style={{ color: "var(--primary)" }}>
            {item.url}
          </a>
        </section>
      ) : null}
    </div>
  );
}
