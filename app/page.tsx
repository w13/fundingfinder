import SearchForm from "../components/SearchForm";
import OpportunityList from "../components/OpportunityList";
import { fetchOpportunities } from "../lib/opportunities";
import { fetchSourceOptions } from "../lib/sources";
import { fetchShortlist } from "../lib/shortlist";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function Page({ searchParams }: PageProps) {
  const query = typeof searchParams?.q === "string" ? searchParams.q : "";
  const source = typeof searchParams?.source === "string" ? searchParams.source : "";
  const minScore = typeof searchParams?.minScore === "string" ? searchParams.minScore : "";

  const [{ items, warning }, sourcesResult, shortlistResult] = await Promise.all([
    fetchOpportunities({
      query: query || undefined,
      source: source || undefined,
      minScore: minScore || undefined
    }),
    fetchSourceOptions(),
    fetchShortlist()
  ]);

  const shortlistKeys = shortlistResult.items.map((item) => `${item.source}:${item.opportunityId}`);

  const combinedWarning = warning ?? sourcesResult.warning ?? shortlistResult.warning;

  return (
    <div className="grid">
      <section className="hero">
        <p className="pill">AI-native grant aggregation</p>
        <h2 className="hero__title">Funding Intelligence Dashboard</h2>
        <p className="hero__subtitle">
          The Grant Sentinel funnel mirrors public grant metadata, filters for private-sector eligibility, and escalates
          the top matches into AI-powered feasibility scoring.
        </p>
        {combinedWarning ? (
          <div className="card card--flat" style={{ background: "#fef3c7", color: "#92400e" }}>
            {combinedWarning}
          </div>
        ) : null}
      </section>

      <section className="grid grid-3">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Stage 1 · Metadata Mirror</h3>
          <p className="muted">
            Polls federal APIs and global funding registries to capture the latest listings with private-sector eligibility.
          </p>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Stage 2 · PDF Harvester</h3>
          <p className="muted">
            Uses Browser Rendering and R2 storage to extract program requirements and evaluation criteria at scale.
          </p>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Stage 3 · AI Analyst</h3>
          <p className="muted">
            Scores feasibility, profitability, and vectors each opportunity for semantic search.
          </p>
        </div>
      </section>

      <SearchForm query={query} source={source} minScore={minScore} sources={sourcesResult.sources} />

      <OpportunityList items={items} shortlistKeys={shortlistKeys} showShortlistActions />
    </div>
  );
}
