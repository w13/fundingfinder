type SearchFormProps = {
  query?: string;
  source?: string;
  minScore?: string;
};

export default function SearchForm({ query, source, minScore }: SearchFormProps) {
  return (
    <form
      method="get"
      action="/"
      style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr auto",
        gap: "12px",
        alignItems: "end",
        marginBottom: "24px"
      }}
    >
      <label style={{ display: "grid", gap: "6px" }}>
        <span style={{ fontSize: "12px", fontWeight: 600 }}>Keyword search</span>
        <input
          name="q"
          defaultValue={query}
          placeholder="digital therapeutics, clinical decision support"
          style={{
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #cbd5f5"
          }}
        />
      </label>
      <label style={{ display: "grid", gap: "6px" }}>
        <span style={{ fontSize: "12px", fontWeight: 600 }}>Source</span>
        <select
          name="source"
          defaultValue={source ?? ""}
          style={{ padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5f5" }}
        >
          <option value="">All</option>
          <option value="grants_gov">Grants.gov</option>
          <option value="sam_gov">SAM.gov</option>
          <option value="hrsa">HRSA</option>
        </select>
      </label>
      <label style={{ display: "grid", gap: "6px" }}>
        <span style={{ fontSize: "12px", fontWeight: 600 }}>Min feasibility</span>
        <input
          name="minScore"
          defaultValue={minScore}
          placeholder="80"
          style={{
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #cbd5f5"
          }}
        />
      </label>
      <button
        type="submit"
        style={{
          padding: "10px 18px",
          borderRadius: "8px",
          border: "none",
          background: "#1d4ed8",
          color: "#ffffff",
          fontWeight: 600,
          cursor: "pointer"
        }}
      >
        Search
      </button>
    </form>
  );
}
