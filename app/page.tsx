import Link from "next/link";
import SearchForm from "../components/SearchForm";
import OpportunityList from "../components/OpportunityList";
import { fetchOpportunities } from "../lib/opportunities";
import { fetchSourceOptions } from "../lib/sources";
import { fetchShortlist } from "../lib/shortlist";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

export default async function Page({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams instanceof Promise ? await searchParams : (searchParams ?? {});
  const query = typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q : "";
  const source = typeof resolvedSearchParams?.source === "string" ? resolvedSearchParams.source : "";
  const minScore = typeof resolvedSearchParams?.minScore === "string" ? resolvedSearchParams.minScore : "";
  const rawMode = typeof resolvedSearchParams?.mode === "string" ? resolvedSearchParams.mode : "smart";
  const resolvedMode = rawMode === "exact" || rawMode === "any" ? rawMode : "smart";

  const [{ items, warning }, sourcesResult, shortlistResult] = await Promise.all([
    fetchOpportunities({
      query: query || undefined,
      source: source || undefined,
      minScore: minScore || undefined,
      mode: resolvedMode
    }),
    fetchSourceOptions(),
    fetchShortlist()
  ]);

  const shortlistKeys = shortlistResult.items.map((item) => `${item.source}:${item.opportunityId}`);

  const combinedWarning = warning ?? sourcesResult.warning ?? shortlistResult.warning;

  return (
    <div className="grid">
      <section className="hero">
        <h2 className="hero__title">Dashboard</h2>
        {combinedWarning ? (
          <div className="card card--flat" style={{ background: "#fef3c7", color: "#92400e" }}>
            {combinedWarning}
          </div>
        ) : null}
      </section>

      <section className="grid grid-3" style={{ marginBottom: "32px" }}>
        <Link href="/sources" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
          <div className="card" style={{ cursor: "pointer", height: "100%" }}>
            <h3 style={{ marginTop: 0, marginBottom: "12px" }}>Stage 1 · Metadata Mirror</h3>
            <p className="muted" style={{ marginBottom: "16px", lineHeight: "1.6" }}>
              Polls federal APIs and global funding registries to capture the latest listings with private-sector eligibility.
            </p>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--primary)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}>
              Manage Sources
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </p>
          </div>
        </Link>
        <Link href="/sources" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
          <div className="card" style={{ cursor: "pointer", height: "100%" }}>
            <h3 style={{ marginTop: 0, marginBottom: "12px" }}>Stage 2 · PDF Harvester</h3>
            <p className="muted" style={{ marginBottom: "16px", lineHeight: "1.6" }}>
              Uses Browser Rendering and R2 storage to extract program requirements and evaluation criteria at scale.
            </p>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--primary)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}>
              View Analytics
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </p>
          </div>
        </Link>
        <div className="card" style={{ height: "100%" }}>
          <h3 style={{ marginTop: 0, marginBottom: "12px" }}>Stage 3 · AI Analyst</h3>
          <p className="muted" style={{ marginBottom: "16px", lineHeight: "1.6" }}>
            Scores feasibility, profitability, and vectors each opportunity for semantic search.
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)", fontWeight: 500 }}>
            Results shown below
          </p>
        </div>
      </section>

      <SearchForm query={query} source={source} minScore={minScore} mode={resolvedMode} sources={sourcesResult.sources} />

      <OpportunityList items={items} shortlistKeys={shortlistKeys} showShortlistActions />
    </div>
  );
}
