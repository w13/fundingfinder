type SearchFormProps = {
  query?: string;
  source?: string;
  minScore?: string;
};

export default function SearchForm({ query, source, minScore }: SearchFormProps) {
  return (
    <form method="get" action="/" className="card card--flat grid search-form">
      <label style={{ display: "grid", gap: "6px" }}>
        <span className="pill">Keyword search</span>
        <input
          className="input"
          name="q"
          defaultValue={query}
          placeholder="digital therapeutics, clinical decision support"
        />
      </label>
      <label style={{ display: "grid", gap: "6px" }}>
        <span className="pill">Source</span>
        <select className="select" name="source" defaultValue={source ?? ""}>
          <option value="">All</option>
          <option value="grants_gov">Grants.gov</option>
          <option value="sam_gov">SAM.gov</option>
          <option value="hrsa">HRSA</option>
        </select>
      </label>
      <label style={{ display: "grid", gap: "6px" }}>
        <span className="pill">Min feasibility</span>
        <input className="input" name="minScore" defaultValue={minScore} placeholder="80" />
      </label>
      <button type="submit" className="button">
        Search
      </button>
    </form>
  );
}
