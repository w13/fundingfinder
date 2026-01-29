import Link from "next/link";
import SearchForm from "../components/SearchForm";
import OpportunityList from "../components/OpportunityList";
import WarningBanner from "../components/WarningBanner";
import SavedSearchPanel from "../components/SavedSearchPanel";
import { fetchOpportunities } from "../lib/api/opportunities";
import { fetchSourceOptions } from "../lib/api/sources";
import { fetchShortlist } from "../lib/api/shortlist";
import { fetchSavedSearches } from "../lib/api/search";
import { logServerError } from "../lib/errors/serverErrorLogger";
import { isReadOnlyMode } from "../lib/domain/constants";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

// Force dynamic rendering to avoid static generation issues
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: PageProps) {
  try {
    const resolvedSearchParams = searchParams instanceof Promise ? await searchParams : (searchParams ?? {});
    const query = typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q : "";
    const source = typeof resolvedSearchParams?.source === "string" ? resolvedSearchParams.source : "";
    const minScore = typeof resolvedSearchParams?.minScore === "string" ? resolvedSearchParams.minScore : "";
    const rawMode = typeof resolvedSearchParams?.mode === "string" ? resolvedSearchParams.mode : "smart";
    const resolvedMode = rawMode === "exact" || rawMode === "any" ? rawMode : "smart";

    const [{ items, warning }, sourcesResult, shortlistResult, savedSearchResult] = await Promise.all([
      fetchOpportunities({
        query: query || undefined,
        source: source || undefined,
        minScore: minScore || undefined,
        mode: resolvedMode
      }).catch((err) => {
        logServerError(err, { component: "Page", action: "fetchOpportunities" });
        return { items: [], warning: `Failed to load opportunities: ${err instanceof Error ? err.message : "Unknown error"}` };
      }),
      fetchSourceOptions().catch((err) => {
        logServerError(err, { component: "Page", action: "fetchSourceOptions" });
        return { sources: [], warning: `Failed to load sources: ${err instanceof Error ? err.message : "Unknown error"}` };
      }),
      fetchShortlist().catch((err) => {
        logServerError(err, { component: "Page", action: "fetchShortlist" });
        return { items: [], warning: `Failed to load shortlist: ${err instanceof Error ? err.message : "Unknown error"}` };
      }),
      fetchSavedSearches().catch((err) => {
        logServerError(err, { component: "Page", action: "fetchSavedSearches" });
        return { searches: [], warning: `Failed to load saved searches: ${err instanceof Error ? err.message : "Unknown error"}` };
      })
    ]);

  const shortlistKeys = shortlistResult.items.map((item) => `${item.source}:${item.opportunityId}`);

  const combinedWarnings = [warning, sourcesResult.warning, shortlistResult.warning, savedSearchResult.warning].filter(Boolean);
  const parsedMinScore = minScore ? Number(minScore) : null;
  const minScoreNumber = parsedMinScore !== null && Number.isNaN(parsedMinScore) ? null : parsedMinScore;
  const readOnly = isReadOnlyMode();

  return (
    <div className="grid">
      <section className="hero">
        <h2 className="hero__title">Global Funding Intelligence</h2>
        <p className="hero__subtitle">
          AI-powered aggregator for government grants, tenders, and procurement opportunities worldwide.
        </p>
        <WarningBanner warnings={combinedWarnings} />
      </section>

      <section className="grid grid-3" style={{ marginBottom: "32px" }}>
        <Link href="/sources" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
          <div className="card" style={{ cursor: "pointer", height: "100%" }}>
            <h3 style={{ marginTop: 0, marginBottom: "12px" }}>Global Coverage</h3>
            <p className="muted" style={{ marginBottom: "16px", lineHeight: "1.6" }}>
              Aggregates real-time data from Grants.gov, SAM.gov, World Bank, Prozorro, and 50+ international registries via APIs and bespoke scrapers.
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
            <h3 style={{ marginTop: 0, marginBottom: "12px" }}>Intelligent Ingestion</h3>
            <p className="muted" style={{ marginBottom: "16px", lineHeight: "1.6" }}>
              Parses PDF, XML, CSV, and HTML formats using specialized scraping engines and browser rendering to extract structured criteria.
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
          <h3 style={{ marginTop: 0, marginBottom: "12px" }}>Agentic Reasoning</h3>
          <p className="muted" style={{ marginBottom: "16px", lineHeight: "1.6" }}>
            Autonomous AI agents score feasibility, profitability, and suitability for every opportunity using LLMs and semantic vector search.
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)", fontWeight: 500 }}>
            Results shown below
          </p>
        </div>
      </section>

      <SavedSearchPanel
        initialSearches={savedSearchResult.searches ?? []}
        currentSearch={{
          query,
          source,
          minScore: minScoreNumber,
          mode: resolvedMode
        }}
        readOnly={readOnly}
      />

      <SearchForm query={query} source={source} minScore={minScore} mode={resolvedMode} sources={sourcesResult.sources} />

      <OpportunityList
        items={items}
        shortlistKeys={shortlistKeys}
        showShortlistActions
        searchContext={{ query, source, minScore: minScoreNumber, mode: resolvedMode }}
        readOnly={readOnly}
      />
    </div>
  );
  } catch (error) {
    logServerError(error, { component: "Page", action: "render" });
    throw error; // Re-throw to let Next.js error boundary handle it
  }
}
