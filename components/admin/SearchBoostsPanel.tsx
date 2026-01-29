"use client";

import { useState } from "react";
import type { SearchBoost } from "../../lib/domain/types";
import { deleteSearchBoost, upsertSearchBoost } from "../../lib/api/admin";
import { useErrorLogger } from "../../lib/errors/useErrorLogger";

type SearchBoostsPanelProps = {
  initialBoosts: SearchBoost[];
  readOnly?: boolean;
};

export default function SearchBoostsPanel({ initialBoosts, readOnly = false }: SearchBoostsPanelProps) {
  const { logWarning } = useErrorLogger("SearchBoostsPanel");
  const [boosts, setBoosts] = useState<SearchBoost[]>(initialBoosts);
  const [form, setForm] = useState({ entityType: "source", entityValue: "", boost: "1" });
  const [isSaving, setIsSaving] = useState(false);
  const parsedBoost = Number(form.boost);
  const boostInvalid = Number.isNaN(parsedBoost);

  const handleSave = async () => {
    if (readOnly) return;
    setIsSaving(true);
    const result = await upsertSearchBoost({
      entityType: form.entityType as SearchBoost["entityType"],
      entityValue: form.entityValue.trim(),
      boost: parsedBoost
    });
    if (result.warning) {
      logWarning(result.warning, { action: "save-boost" });
    }
    if (result.boost) {
      setBoosts((prev) => {
        const existing = prev.find((item) => item.id === result.boost!.id);
        if (existing) {
          return prev.map((item) => (item.id === result.boost!.id ? result.boost! : item));
        }
        return [result.boost!, ...prev];
      });
      setForm({ entityType: "source", entityValue: "", boost: "1" });
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (readOnly) return;
    const result = await deleteSearchBoost(id);
    if (result.warning) {
      logWarning(result.warning, { action: "delete-boost" });
    }
    if (result.deleted) {
      setBoosts((prev) => prev.filter((item) => item.id !== id));
    }
  };

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Search boosts</h3>
      <p className="muted" style={{ marginTop: "4px" }}>
        Nudge ranking by boosting sources or agencies.
      </p>

      <div className="grid grid-3" style={{ marginTop: "16px" }}>
        <label style={{ display: "grid", gap: "6px" }}>
          <span className="pill">Entity Type</span>
          <select
            className="select"
            value={form.entityType}
            disabled={readOnly}
            onChange={(event) => setForm({ ...form, entityType: event.target.value })}
          >
            <option value="source">Source</option>
            <option value="agency">Agency</option>
          </select>
        </label>
        <label style={{ display: "grid", gap: "6px" }}>
          <span className="pill">Entity Value</span>
          <input
            className="input"
            value={form.entityValue}
            disabled={readOnly}
            onChange={(event) => setForm({ ...form, entityValue: event.target.value })}
            placeholder="e.g. grants_gov"
          />
        </label>
        <label style={{ display: "grid", gap: "6px" }}>
          <span className="pill">Boost</span>
          <input
            className="input"
            type="number"
            value={form.boost}
            disabled={readOnly}
            onChange={(event) => setForm({ ...form, boost: event.target.value })}
          />
        </label>
      </div>

      <button className="button" type="button" disabled={readOnly || isSaving || !form.entityValue || boostInvalid} onClick={handleSave} style={{ marginTop: "12px" }}>
        {isSaving ? "Saving..." : "Save boost"}
      </button>

      <div style={{ marginTop: "20px", display: "grid", gap: "10px" }}>
        {boosts.length === 0 ? (
          <div style={{ padding: "12px", background: "#f8fafc", border: "1px solid var(--border-light)" }}>
            <p className="muted" style={{ margin: 0, fontSize: "13px" }}>
              No boosts configured.
            </p>
          </div>
        ) : (
          boosts.map((boost) => (
            <div
              key={boost.id}
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
                <div style={{ fontWeight: 600, fontSize: "14px" }}>
                  {boost.entityType}: {boost.entityValue}
                </div>
                <div className="muted" style={{ fontSize: "12px" }}>
                  Boost {boost.boost}
                </div>
              </div>
              <button className="button button--secondary button--small" type="button" disabled={readOnly} onClick={() => handleDelete(boost.id)}>
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
