import Link from "next/link";
import type { Opportunity } from "../lib/types";
import { ScoreBadge } from "./ScoreBadge";

type OpportunityListProps = {
  items: Opportunity[];
};

export default function OpportunityList({ items }: OpportunityListProps) {
  if (items.length === 0) {
    return (
      <div style={{ padding: "24px", background: "#ffffff", borderRadius: "12px" }}>
        <h3 style={{ margin: 0 }}>No opportunities yet</h3>
        <p style={{ marginTop: "8px", color: "#475569" }}>
          Trigger the ingestion Worker to populate the database, or refine your search.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "16px" }}>
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/opportunities/${item.id}`}
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "18px",
            border: "1px solid #e2e8f0",
            display: "grid",
            gap: "10px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px" }}>{item.title}</h3>
              <p style={{ margin: "4px 0 0", color: "#475569" }}>
                {item.agency ?? "Unknown agency"} · {item.source.replace("_", ".")}
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
              <ScoreBadge label="Feasibility" value={item.feasibilityScore} />
              <ScoreBadge label="Profitability" value={item.profitabilityScore} />
            </div>
          </div>
          <p style={{ margin: 0, color: "#334155" }}>{item.summary ?? "No summary captured yet."}</p>
          <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#475569" }}>
            <span>Posted: {item.postedDate ?? "N/A"}</span>
            <span>Due: {item.dueDate ?? "N/A"}</span>
            <span>Keyword score: {item.keywordScore}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
