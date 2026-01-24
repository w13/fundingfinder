type ScoreBadgeProps = {
  label: string;
  value: number | null;
};

export function ScoreBadge({ label, value }: ScoreBadgeProps) {
  const score = value ?? 0;
  const variant = value === null ? "muted" : score >= 80 ? "good" : score >= 60 ? "warn" : "low";

  return (
    <span className={`badge badge--${variant}`}>
      {label}: {value ?? "N/A"}
    </span>
  );
}
