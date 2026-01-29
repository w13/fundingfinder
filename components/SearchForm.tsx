"use client";

import { useState } from "react";
import * as Select from "@radix-ui/react-select";
import * as Label from "@radix-ui/react-label";
import { ChevronDownIcon } from "@radix-ui/react-icons";

type SearchFormProps = {
  query?: string;
  source?: string;
  minScore?: string;
  mode?: "smart" | "exact" | "any";
  sources?: Array<{ id: string; name: string; country?: string | null }>;
};

export default function SearchForm({ query, source, minScore, mode = "smart", sources = [] }: SearchFormProps) {
  const [selectedMode, setSelectedMode] = useState(mode);

  return (
    <form method="get" action="/" className="card card--flat grid search-form" style={{ marginBottom: "24px" }}>
      <Label.Root style={{ display: "grid", gap: "8px" }}>
        <span className="pill">Keyword search</span>
        <input
          className="input"
          name="q"
          defaultValue={query}
          placeholder="digital therapeutics, clinical decision support"
        />
      </Label.Root>
      <Label.Root style={{ display: "grid", gap: "8px" }}>
        <span className="pill">Source</span>
        <input
          className="input"
          list="sourceOptions"
          name="source"
          defaultValue={source ?? ""}
          placeholder="all sources"
        />
        <datalist id="sourceOptions">
          {(sources ?? []).map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </datalist>
      </Label.Root>
      <Label.Root style={{ display: "grid", gap: "8px" }}>
        <span className="pill">Min feasibility</span>
        <input className="input" name="minScore" defaultValue={minScore} placeholder="80" />
      </Label.Root>
      <Label.Root style={{ display: "grid", gap: "8px" }}>
        <span className="pill">Search mode</span>
        <Select.Root value={selectedMode} onValueChange={(value) => setSelectedMode(value as "smart" | "exact" | "any")}>
          <input type="hidden" name="mode" value={selectedMode} />
          <Select.Trigger
            className="select"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              fontSize: "14px",
              border: "1px solid var(--border)",
              borderRadius: "0",
              background: "#ffffff",
              cursor: "pointer",
              transition: "all 0.2s ease",
              width: "100%"
            }}
          >
            <Select.Value />
            <Select.Icon>
              <ChevronDownIcon style={{ width: "12px", height: "12px" }} />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content
              style={{
                background: "#ffffff",
                border: "1px solid var(--border)",
                borderRadius: "0",
                boxShadow: "var(--shadow-md)",
                zIndex: 1000,
                minWidth: "var(--radix-select-trigger-width)",
                maxHeight: "300px",
                overflow: "auto"
              }}
            >
              <Select.Viewport>
                <Select.Item
                  value="smart"
                  style={{
                    padding: "10px 12px",
                    fontSize: "14px",
                    cursor: "pointer",
                    outline: "none"
                  }}
                >
                  <Select.ItemText>Smart (all terms)</Select.ItemText>
                </Select.Item>
                <Select.Item
                  value="any"
                  style={{
                    padding: "10px 12px",
                    fontSize: "14px",
                    cursor: "pointer",
                    outline: "none"
                  }}
                >
                  <Select.ItemText>Any term</Select.ItemText>
                </Select.Item>
                <Select.Item
                  value="exact"
                  style={{
                    padding: "10px 12px",
                    fontSize: "14px",
                    cursor: "pointer",
                    outline: "none"
                  }}
                >
                  <Select.ItemText>Exact phrase</Select.ItemText>
                </Select.Item>
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </Label.Root>
      <button type="submit" className="button" style={{ alignSelf: "end" }}>
        Search
      </button>
    </form>
  );
}
