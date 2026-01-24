import Link from "next/link";
import type { Opportunity } from "../lib/types";
import { ScoreBadge } from "./ScoreBadge";

type OpportunityListProps = {
  items: Opportunity[];
};

export default function OpportunityList({ items }: OpportunityListProps) {
  if (items.length === 0) {
    return (
      <div className="card">
        <h3 style={{ margin: 0 }}>No opportunities yet</h3>
        <p className="muted" style={{ marginTop: "8px" }}>
          Trigger the ingestion Worker to populate the database, or refine your search.
        </p>
      </div>
    );
  }

  return (
    <div className="grid">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/opportunities/${item.id}`}
          className="card"
          style={{ display: "grid", gap: "12px" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px" }}>{item.title}</h3>
              <p className="muted" style={{ margin: "4px 0 0" }}>
                {item.agency ?? "Unknown agency"} · {item.source.replace("_", ".")}
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
              <ScoreBadge label="Feasibility" value={item.feasibilityScore} />
              <ScoreBadge label="Profitability" value={item.profitabilityScore} />
            </div>
          </div>
          <p style={{ margin: 0 }}>{item.summary ?? "No summary captured yet."}</p>
          <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#64748b", flexWrap: "wrap" }}>
            <span>Posted: {item.postedDate ?? "N/A"}</span>
            <span>Due: {item.dueDate ?? "N/A"}</span>
            <span>Keyword score: {item.keywordScore}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
