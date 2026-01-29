"use client";

import { useState } from "react";
import { INTEGRATION_TYPE_OPTIONS } from "../../lib/domain/constants";
import { createFundingSource, previewFundingSource } from "../../lib/api/admin";
import { useErrorLogger } from "../../lib/errors/useErrorLogger";

type SourcePipelinePanelProps = {
  readOnly?: boolean;
};

export default function SourcePipelinePanel({ readOnly = false }: SourcePipelinePanelProps) {
  const { logWarning } = useErrorLogger("SourcePipelinePanel");
  const [form, setForm] = useState({
    id: "",
    name: "",
    integrationType: INTEGRATION_TYPE_OPTIONS[0].value,
    autoUrl: "",
    expectedResults: "",
    maxNotices: "",
    urlOverride: ""
  });
  const [preview, setPreview] = useState<{ sample: Array<{ opportunityId: string; title: string; agency: string | null }>; count: number } | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handlePreview = async () => {
    if (readOnly) return;
    setIsPreviewing(true);
    const result = await previewFundingSource({
      id: form.id.trim(),
      name: form.name.trim(),
      integrationType: form.integrationType as "core_api" | "ted_xml_zip" | "bulk_xml_zip" | "bulk_xml" | "bulk_json" | "bulk_csv" | "manual_url",
      autoUrl: form.autoUrl.trim() || null,
      expectedResults: form.expectedResults ? Number(form.expectedResults) : null,
      maxNotices: form.maxNotices ? Number(form.maxNotices) : null,
      url: form.urlOverride.trim() || null
    });
    if (result.warning) {
      logWarning(result.warning, { action: "preview-source" });
    }
    setPreview({ sample: result.sample, count: result.count });
    setIsPreviewing(false);
  };

  const handleCreate = async () => {
    if (readOnly) return;
    setIsCreating(true);
    const result = await createFundingSource({
      id: form.id.trim(),
      name: form.name.trim(),
      integrationType: form.integrationType as "core_api" | "ted_xml_zip" | "bulk_xml_zip" | "bulk_xml" | "bulk_json" | "bulk_csv" | "manual_url",
      autoUrl: form.autoUrl.trim() || null,
      expectedResults: form.expectedResults ? Number(form.expectedResults) : null,
      maxNotices: form.maxNotices ? Number(form.maxNotices) : null,
      active: true
    });
    if (result.warning) {
      logWarning(result.warning, { action: "create-source" });
    }
    setIsCreating(false);
  };

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Add new source (safe pipeline)</h3>
      <p className="muted" style={{ marginTop: "4px" }}>
        Preview a source sync before persisting it to the registry.
      </p>
      <div className="grid grid-2" style={{ marginTop: "16px" }}>
        <label style={{ display: "grid", gap: "6px" }}>
          <span className="pill">Source ID</span>
          <input
            className="input"
            value={form.id}
            disabled={readOnly}
            onChange={(event) => setForm({ ...form, id: event.target.value })}
            placeholder="e.g. canada_buys"
          />
        </label>
        <label style={{ display: "grid", gap: "6px" }}>
          <span className="pill">Display Name</span>
          <input
            className="input"
            value={form.name}
            disabled={readOnly}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="CanadaBuys"
          />
        </label>
        <label style={{ display: "grid", gap: "6px" }}>
          <span className="pill">Integration Type</span>
          <select
            className="select"
            value={form.integrationType}
            disabled={readOnly}
            onChange={(event) => setForm({ ...form, integrationType: event.target.value })}
          >
            {INTEGRATION_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "grid", gap: "6px" }}>
          <span className="pill">Auto URL</span>
          <input
            className="input"
            value={form.autoUrl}
            disabled={readOnly}
            onChange={(event) => setForm({ ...form, autoUrl: event.target.value })}
            placeholder="https://example.com/export.zip"
          />
        </label>
        <label style={{ display: "grid", gap: "6px" }}>
          <span className="pill">Expected Results</span>
          <input
            className="input"
            value={form.expectedResults}
            disabled={readOnly}
            onChange={(event) => setForm({ ...form, expectedResults: event.target.value })}
            placeholder="1000"
          />
        </label>
        <label style={{ display: "grid", gap: "6px" }}>
          <span className="pill">Max Notices</span>
          <input
            className="input"
            value={form.maxNotices}
            disabled={readOnly}
            onChange={(event) => setForm({ ...form, maxNotices: event.target.value })}
            placeholder="200"
          />
        </label>
        <label style={{ display: "grid", gap: "6px" }}>
          <span className="pill">Preview URL Override</span>
          <input
            className="input"
            value={form.urlOverride}
            disabled={readOnly}
            onChange={(event) => setForm({ ...form, urlOverride: event.target.value })}
            placeholder="Optional URL for dry run"
          />
        </label>
      </div>
      <div style={{ display: "flex", gap: "8px", marginTop: "16px", flexWrap: "wrap" }}>
        <button className="button button--secondary" type="button" disabled={readOnly || isPreviewing || !form.id || !form.name} onClick={handlePreview}>
          {isPreviewing ? "Previewing..." : "Dry run preview"}
        </button>
        <button className="button" type="button" disabled={readOnly || isCreating || !form.id || !form.name} onClick={handleCreate}>
          {isCreating ? "Creating..." : "Create source"}
        </button>
      </div>
      {preview && (
        <div style={{ marginTop: "16px" }}>
          <div className="pill" style={{ marginBottom: "8px" }}>
            Previewed {preview.count} records (showing {preview.sample.length})
          </div>
          <div style={{ display: "grid", gap: "6px" }}>
            {preview.sample.map((item) => (
              <div key={item.opportunityId} style={{ padding: "10px 12px", background: "#f8fafc", border: "1px solid var(--border-light)" }}>
                <div style={{ fontWeight: 600, fontSize: "13px" }}>{item.title}</div>
                <div className="muted" style={{ fontSize: "12px" }}>
                  {item.opportunityId} · {item.agency ?? "Unknown agency"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
