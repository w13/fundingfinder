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

      <section className="grid grid-3">
        <Link href="/sources" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
          <div className="card" style={{ cursor: "pointer", transition: "transform 0.2s ease, box-shadow 0.2s ease" }}>
            <h3 style={{ marginTop: 0 }}>Stage 1 · Metadata Mirror</h3>
            <p className="muted">
              Polls federal APIs and global funding registries to capture the latest listings with private-sector eligibility.
            </p>
            <p style={{ marginTop: "8px", fontSize: "12px", color: "var(--primary)", fontWeight: 500 }}>
              Manage Sources →
            </p>
          </div>
        </Link>
        <Link href="/sources" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
          <div className="card" style={{ cursor: "pointer", transition: "transform 0.2s ease, box-shadow 0.2s ease" }}>
            <h3 style={{ marginTop: 0 }}>Stage 2 · PDF Harvester</h3>
            <p className="muted">
              Uses Browser Rendering and R2 storage to extract program requirements and evaluation criteria at scale.
            </p>
            <p style={{ marginTop: "8px", fontSize: "12px", color: "var(--primary)", fontWeight: 500 }}>
              View Analytics →
            </p>
          </div>
        </Link>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Stage 3 · AI Analyst</h3>
          <p className="muted">
            Scores feasibility, profitability, and vectors each opportunity for semantic search.
          </p>
          <p style={{ marginTop: "8px", fontSize: "12px", color: "var(--muted)" }}>
            Results shown below
          </p>
        </div>
      </section>

      <SearchForm query={query} source={source} minScore={minScore} mode={resolvedMode} sources={sourcesResult.sources} />

      <OpportunityList items={items} shortlistKeys={shortlistKeys} showShortlistActions />
    </div>
  );
}
