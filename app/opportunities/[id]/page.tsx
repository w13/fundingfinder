import Link from "next/link";
import { fetchOpportunityById } from "../../../lib/opportunities";
import { ScoreBadge } from "../../../components/ScoreBadge";

export default async function OpportunityPage({ params }: { params: { id: string } }) {
  const item = await fetchOpportunityById(params.id);

  if (!item) {
    return (
      <div>
        <p>Opportunity not found.</p>
        <Link href="/">Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      <Link href="/" style={{ color: "#1d4ed8" }}>
        ← Back to dashboard
      </Link>
      <div style={{ display: "grid", gap: "8px" }}>
        <h2 style={{ margin: 0 }}>{item.title}</h2>
        <p style={{ margin: 0, color: "#475569" }}>
          {item.agency ?? "Unknown agency"} · {item.source.replace("_", ".")}
        </p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <ScoreBadge label="Feasibility" value={item.feasibilityScore} />
          <ScoreBadge label="Profitability" value={item.profitabilityScore} />
        </div>
      </div>

      <section style={{ display: "grid", gap: "8px" }}>
        <h3 style={{ margin: 0 }}>AI Feasibility Summary</h3>
        {item.analysisSummary.length > 0 ? (
          <ul>
            {item.analysisSummary.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        ) : (
          <p style={{ margin: 0, color: "#475569" }}>No AI summary available yet.</p>
        )}
      </section>

      <section style={{ display: "grid", gap: "8px" }}>
        <h3 style={{ margin: 0 }}>Key Constraints</h3>
        {item.constraints.length > 0 ? (
          <ul>
            {item.constraints.map((constraint) => (
              <li key={constraint}>{constraint}</li>
            ))}
          </ul>
        ) : (
          <p style={{ margin: 0, color: "#475569" }}>No constraints captured.</p>
        )}
      </section>

      <section style={{ display: "grid", gap: "8px" }}>
        <h3 style={{ margin: 0 }}>Eligibility</h3>
        <p style={{ margin: 0, color: "#475569" }}>{item.eligibility ?? "Not provided."}</p>
        <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "#475569" }}>
          <span>For-profit: {item.forProfitEligible ? "Yes" : "No"}</span>
          <span>Small business: {item.smallBusinessEligible ? "Yes" : "No"}</span>
        </div>
      </section>

      <section style={{ display: "grid", gap: "8px" }}>
        <h3 style={{ margin: 0 }}>Documents</h3>
        {item.documents.length > 0 ? (
          <div style={{ display: "grid", gap: "12px" }}>
            {item.documents.map((doc) => (
              <div key={doc.id} style={{ padding: "12px", border: "1px solid #e2e8f0", borderRadius: "10px" }}>
                <div style={{ fontSize: "12px", color: "#475569" }}>R2 key: {doc.r2Key}</div>
                <a href={doc.documentUrl} target="_blank" rel="noreferrer" style={{ color: "#1d4ed8" }}>
                  View source PDF
                </a>
                {doc.sectionMap ? (
                  <ul style={{ margin: "8px 0 0", color: "#475569" }}>
                    <li>Program: {doc.sectionMap.programDescription ? "Captured" : "Missing"}</li>
                    <li>Requirements: {doc.sectionMap.requirements ? "Captured" : "Missing"}</li>
                    <li>Evaluation: {doc.sectionMap.evaluationCriteria ? "Captured" : "Missing"}</li>
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, color: "#475569" }}>No documents stored yet.</p>
        )}
      </section>

      {item.url ? (
        <section style={{ display: "grid", gap: "8px" }}>
          <h3 style={{ margin: 0 }}>Official Listing</h3>
          <a href={item.url} target="_blank" rel="noreferrer" style={{ color: "#1d4ed8" }}>
            {item.url}
          </a>
        </section>
      ) : null}
    </div>
  );
}
