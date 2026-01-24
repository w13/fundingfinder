import Link from "next/link";
import { revalidatePath } from "next/cache";
import type { Opportunity } from "../lib/types";
import { formatSourceLabel } from "../lib/format";
import { addShortlist } from "../lib/shortlist";
import { ScoreBadge } from "./ScoreBadge";

type OpportunityListProps = {
  items: Opportunity[];
  shortlistKeys?: string[];
  showShortlistActions?: boolean;
};

export default function OpportunityList({ items, shortlistKeys = [], showShortlistActions = false }: OpportunityListProps) {
  const shortlistSet = new Set(shortlistKeys);

  async function handleShortlist(formData: FormData) {
    "use server";
    const opportunityId = String(formData.get("opportunityId") ?? "").trim();
    const source = String(formData.get("source") ?? "").trim();
    if (!opportunityId || !source) return;
    await addShortlist(opportunityId, source);
    revalidatePath("/");
    revalidatePath("/shortlist");
  }

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
        <div key={item.id} className="card" style={{ display: "grid", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <div>
              <Link href={`/opportunities/${item.id}`}>
                <h3 style={{ margin: 0, fontSize: "18px" }}>{item.title}</h3>
              </Link>
              <p className="muted" style={{ margin: "4px 0 0" }}>
                {item.agency ?? "Unknown agency"} · {formatSourceLabel(item.source)}
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
              <ScoreBadge label="Feasibility" value={item.feasibilityScore} />
              <ScoreBadge label="Suitability" value={item.suitabilityScore ?? null} />
              <ScoreBadge label="Profitability" value={item.profitabilityScore} />
            </div>
          </div>
          <p style={{ margin: 0 }}>{item.summary ?? "No summary captured yet."}</p>
          <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#64748b", flexWrap: "wrap" }}>
            <span>Posted: {item.postedDate ?? "N/A"}</span>
            <span>Due: {item.dueDate ?? "N/A"}</span>
            <span>Keyword score: {item.keywordScore}</span>
          </div>
          {showShortlistActions ? (
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {shortlistSet.has(`${item.source}:${item.opportunityId}`) ? (
                <span className="pill">Shortlisted</span>
              ) : (
                <form action={handleShortlist}>
                  <input type="hidden" name="opportunityId" value={item.opportunityId} />
                  <input type="hidden" name="source" value={item.source} />
                  <button className="button button--secondary" type="submit">
                    Add to shortlist
                  </button>
                </form>
              )}
              <Link href={`/opportunities/${item.id}`} className="button button--secondary">
                View details
              </Link>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
