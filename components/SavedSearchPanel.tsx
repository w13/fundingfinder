"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { SavedSearch } from "../lib/domain/types";
import { createSavedSearch, deleteSavedSearch } from "../lib/api/search";
import { useErrorLogger } from "../lib/errors/useErrorLogger";

type SavedSearchPanelProps = {
  initialSearches: SavedSearch[];
  currentSearch: {
    query: string;
    source: string;
    minScore: number | null;
    mode: "smart" | "exact" | "any";
  };
  readOnly?: boolean;
};

export default function SavedSearchPanel({ initialSearches, currentSearch, readOnly = false }: SavedSearchPanelProps) {
  const { logWarning } = useErrorLogger("SavedSearchPanel");
  const [searches, setSearches] = useState<SavedSearch[]>(initialSearches);
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isSearchEmpty = useMemo(() => {
    return !currentSearch.query && !currentSearch.source && !currentSearch.minScore && currentSearch.mode === "smart";
  }, [currentSearch]);

  const handleSave = async () => {
    if (!name.trim() || readOnly) return;
    setIsSaving(true);
    const result = await createSavedSearch({
      name: name.trim(),
      query: currentSearch.query || null,
      source: currentSearch.source || null,
      minScore: currentSearch.minScore,
      mode: currentSearch.mode
    });
    if (result.warning) {
      logWarning(result.warning, { action: "save-search" });
    }
    if (result.search) {
      setSearches((prev) => [result.search!, ...prev]);
      setName("");
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (readOnly) return;
    const result = await deleteSavedSearch(id);
    if (result.warning) {
      logWarning(result.warning, { action: "delete-search" });
    }
    if (result.removed) {
      setSearches((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const buildSearchLink = (search: SavedSearch) => {
    const params = new URLSearchParams();
    if (search.query) params.set("q", search.query);
    if (search.source) params.set("source", search.source);
    if (typeof search.minScore === "number") params.set("minScore", search.minScore.toString());
    if (search.mode) params.set("mode", search.mode);
    const query = params.toString();
    return query ? `/?${query}` : "/";
  };

  return (
    <div className="card" style={{ marginBottom: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h3 style={{ margin: 0, marginBottom: "4px" }}>Saved searches</h3>
          <p className="muted" style={{ margin: 0, fontSize: "13px" }}>
            Store common filters and jump back to them quickly.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "12px", marginTop: "16px" }}>
        <input
          className="input"
          placeholder={isSearchEmpty ? "Run a search to save it" : "Name this search"}
          value={name}
          disabled={isSaving || readOnly || isSearchEmpty}
          onChange={(event) => setName(event.target.value)}
        />
        <button className="button" type="button" disabled={!name.trim() || isSaving || readOnly || isSearchEmpty} onClick={handleSave}>
          {isSaving ? "Saving..." : "Save search"}
        </button>
      </div>

      <div style={{ marginTop: "20px", display: "grid", gap: "12px" }}>
        {searches.length === 0 ? (
          <div style={{ padding: "16px", background: "#f8fafc", border: "1px solid var(--border-light)" }}>
            <p className="muted" style={{ margin: 0, fontSize: "13px" }}>
              No saved searches yet. Save a query to reuse it later.
            </p>
          </div>
        ) : (
          searches.map((search) => (
            <div
              key={search.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                border: "1px solid var(--border-light)",
                background: "#fff"
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: "14px" }}>{search.name}</div>
                <div className="muted" style={{ fontSize: "12px" }}>
                  {search.query || "All keywords"}
                  {search.source ? ` · ${search.source}` : ""}
                  {typeof search.minScore === "number" ? ` · min score ${search.minScore}` : ""}
                  {search.mode ? ` · ${search.mode}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <Link className="button button--secondary button--small" href={buildSearchLink(search)}>
                  Apply
                </Link>
                <button
                  className="button button--secondary button--small"
                  type="button"
                  onClick={() => handleDelete(search.id)}
                  disabled={readOnly}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
