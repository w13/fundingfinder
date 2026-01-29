import { revalidatePath } from "next/cache";
import type { Opportunity } from "../lib/domain/types";
import { formatSourceLabel } from "../lib/domain/format";
import { addShortlist } from "../lib/api/shortlist";
import { ScoreBadge } from "./ScoreBadge";
import TrackedLink from "./TrackedLink";

type OpportunityListProps = {
  items?: Opportunity[];
  shortlistKeys?: string[];
  showShortlistActions?: boolean;
  searchContext?: {
    query?: string;
    source?: string;
    minScore?: number | null;
    mode?: "smart" | "exact" | "any";
  };
  readOnly?: boolean;
};

export default function OpportunityList({
  items = [],
  shortlistKeys = [],
  showShortlistActions = false,
  searchContext,
  readOnly = false
}: OpportunityListProps) {
  const shortlistSet = new Set(shortlistKeys ?? []);

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
        <h3 style={{ margin: 0, marginBottom: "8px" }}>No opportunities yet</h3>
        <p className="muted" style={{ margin: 0 }}>
          Trigger the ingestion Worker to populate the database, or refine your search.
        </p>
      </div>
    );
  }

  return (
    <div className="grid">
      {items.map((item, index) => (
        <div key={item.id} className="card" style={{ display: "grid", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <TrackedLink
                href={`/opportunities/${item.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
                event={{
                  query: searchContext?.query ?? null,
                  sourceFilter: searchContext?.source ?? null,
                  minScore: searchContext?.minScore ?? null,
                  mode: searchContext?.mode ?? "smart",
                  opportunityId: item.opportunityId,
                  source: item.source,
                  resultId: item.id,
                  position: index + 1
                }}
              >
                <h3 style={{ margin: 0, marginBottom: "8px", fontSize: "18px", fontWeight: 600, color: "var(--text)" }}>
                  {item.title}
                </h3>
              </TrackedLink>
              <p className="muted" style={{ margin: 0, fontSize: "13px" }}>
                {item.agency ?? "Unknown agency"} · {formatSourceLabel(item.source)}
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
              <ScoreBadge label="Feasibility" value={item.feasibilityScore} />
              <ScoreBadge label="Suitability" value={item.suitabilityScore ?? null} />
              <ScoreBadge label="Profitability" value={item.profitabilityScore} />
            </div>
          </div>
          <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.6", color: "var(--text-secondary)" }}>
            {item.summary ?? "No summary captured yet."}
          </p>
          <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "var(--muted)", flexWrap: "wrap", paddingTop: "8px", borderTop: "1px solid var(--border-light)" }}>
            <span>Posted: {item.postedDate ?? "N/A"}</span>
            <span>Due: {item.dueDate ?? "N/A"}</span>
            <span>Keyword score: {item.keywordScore}</span>
          </div>
          {showShortlistActions ? (
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", paddingTop: "8px" }}>
              {shortlistSet.has(`${item.source}:${item.opportunityId}`) ? (
                <span className="pill" style={{ background: "#d1fae5", color: "#065f46", borderColor: "#10b981" }}>Shortlisted</span>
              ) : (
                <form action={handleShortlist} style={{ margin: 0 }}>
                  <input type="hidden" name="opportunityId" value={item.opportunityId} />
                  <input type="hidden" name="source" value={item.source} />
                  <button className="button button--secondary button--small" type="submit" disabled={readOnly}>
                    {readOnly ? "Read-only" : "Add to shortlist"}
                  </button>
                </form>
              )}
              <TrackedLink
                href={`/opportunities/${item.id}`}
                className="button button--secondary button--small"
                event={{
                  query: searchContext?.query ?? null,
                  sourceFilter: searchContext?.source ?? null,
                  minScore: searchContext?.minScore ?? null,
                  mode: searchContext?.mode ?? "smart",
                  opportunityId: item.opportunityId,
                  source: item.source,
                  resultId: item.id,
                  position: index + 1
                }}
              >
                View details
              </TrackedLink>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
