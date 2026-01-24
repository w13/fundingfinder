import SearchForm from "../components/SearchForm";
import OpportunityList from "../components/OpportunityList";
import { fetchOpportunities } from "../lib/opportunities";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function Page({ searchParams }: PageProps) {
  const query = typeof searchParams?.q === "string" ? searchParams.q : "";
  const source = typeof searchParams?.source === "string" ? searchParams.source : "";
  const minScore = typeof searchParams?.minScore === "string" ? searchParams.minScore : "";

  const { items, warning } = await fetchOpportunities({
    query: query || undefined,
    source: source || undefined,
    minScore: minScore || undefined
  });

  return (
    <div>
      <section style={{ display: "grid", gap: "12px", marginBottom: "24px" }}>
        <h2 style={{ margin: 0 }}>Funding Intelligence Dashboard</h2>
        <p style={{ margin: 0, color: "#475569", maxWidth: "720px" }}>
          The Grant Sentinel funnel mirrors public grant metadata, filters by for-profit eligibility, and escalates the top
          matches into AI-powered feasibility scoring.
        </p>
        {warning ? (
          <div style={{ padding: "12px", borderRadius: "8px", background: "#fef3c7", color: "#92400e" }}>{warning}</div>
        ) : null}
      </section>

      <SearchForm query={query} source={source} minScore={minScore} />

      <OpportunityList items={items} />
    </div>
  );
}
