import Link from "next/link";
import { fetchOpportunityById } from "../../../lib/api/opportunities";
import { ScoreBadge } from "../../../components/ScoreBadge";
import { formatSourceLabel } from "../../../lib/domain/format";
import { logServerError } from "../../../lib/errors/serverErrorLogger";
import { handleShortlist } from "./actions";
import { isReadOnlyMode } from "../../../lib/domain/constants";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default async function OpportunityPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const item = await fetchOpportunityById(resolvedParams.id).catch((err) => {
      logServerError(err, { component: "OpportunityPage", action: "fetchOpportunityById", id: resolvedParams.id });
      return null;
    });

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

  const readOnly = isReadOnlyMode();

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
          <input type="hidden" name="opportunityId" value={item.opportunityId} />
          <input type="hidden" name="source" value={item.source} />
          <input type="hidden" name="pageId" value={resolvedParams.id} />
          <button className="button button--secondary" type="submit" disabled={readOnly}>
            {readOnly ? "Read-only" : "Add to shortlist"}
          </button>
        </form>
      </div>

      <section className="card">
        <h3 style={{ margin: 0 }}>AI Feasibility Summary</h3>
        {item.analysisSummary.length > 0 ? (
          <ul>
            {item.analysisSummary.map((bullet, index) => (
              <li key={`summary-${index}`}>{bullet}</li>
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
            {item.constraints.map((constraint, index) => (
              <li key={`constraint-${index}`}>{constraint}</li>
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
  } catch (error) {
    const resolvedParams = params instanceof Promise ? await params : params;
    logServerError(error, { component: "OpportunityPage", action: "render", id: resolvedParams.id });
    throw error; // Re-throw to let Next.js error boundary handle it
  }
}
