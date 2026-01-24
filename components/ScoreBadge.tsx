type ScoreBadgeProps = {
  label: string;
  value: number | null;
};

const COLORS = {
  high: "#16a34a",
  mid: "#f59e0b",
  low: "#dc2626",
  muted: "#475569"
};

export function ScoreBadge({ label, value }: ScoreBadgeProps) {
  const score = value ?? 0;
  const color = value === null ? COLORS.muted : score >= 80 ? COLORS.high : score >= 60 ? COLORS.mid : COLORS.low;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        borderRadius: "999px",
        padding: "4px 10px",
        background: "#ffffff",
        border: `1px solid ${color}`,
        color,
        fontSize: "12px",
        fontWeight: 600
      }}
    >
      {label}: {value ?? "N/A"}
    </span>
  );
}
