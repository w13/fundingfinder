type SearchFormProps = {
  query?: string;
  source?: string;
  minScore?: string;
  mode?: "smart" | "exact" | "any";
  sources?: Array<{ id: string; name: string; country?: string | null }>;
};

export default function SearchForm({ query, source, minScore, mode = "smart", sources = [] }: SearchFormProps) {
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
        <input
          className="input"
          list="sourceOptions"
          name="source"
          defaultValue={source ?? ""}
          placeholder="all sources"
        />
        <datalist id="sourceOptions">
          {sources.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </datalist>
      </label>
      <label style={{ display: "grid", gap: "6px" }}>
        <span className="pill">Min feasibility</span>
        <input className="input" name="minScore" defaultValue={minScore} placeholder="80" />
      </label>
      <label style={{ display: "grid", gap: "6px" }}>
        <span className="pill">Search mode</span>
        <select className="select" name="mode" defaultValue={mode}>
          <option value="smart">Smart (all terms)</option>
          <option value="any">Any term</option>
          <option value="exact">Exact phrase</option>
        </select>
      </label>
      <button type="submit" className="button">
        Search
      </button>
    </form>
  );
}
