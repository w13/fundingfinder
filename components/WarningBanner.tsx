"use client";

import { useEffect, useMemo, useRef } from "react";
import { useErrorLogger } from "../lib/errors/useErrorLogger";

type WarningBannerProps = {
  warnings?: Array<string | null | undefined> | string | null;
  title?: string;
};

export default function WarningBanner({ warnings, title = "Attention" }: WarningBannerProps) {
  const { logWarning } = useErrorLogger("WarningBanner");
  const loggedRef = useRef<Set<string>>(new Set());

  const messages = useMemo(() => {
    if (!warnings) return [];
    const list = Array.isArray(warnings) ? warnings : [warnings];
    return list.filter((item): item is string => Boolean(item && item.trim()));
  }, [warnings]);

  useEffect(() => {
    messages.forEach((message) => {
      if (loggedRef.current.has(message)) return;
      loggedRef.current.add(message);
      logWarning(message, { action: "api-warning" });
    });
  }, [messages, logWarning]);

  if (messages.length === 0) return null;

  return (
    <div
      className="card card--flat"
      style={{
        background: "#fef3c7",
        color: "#92400e",
        padding: "12px 16px",
        border: "1px solid #fde68a",
        marginBottom: "24px"
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: "6px", fontSize: "13px", textTransform: "uppercase" }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: "18px", display: "grid", gap: "4px", fontSize: "13px" }}>
        {messages.map((message, index) => (
          <li key={`${message}-${index}`}>{message}</li>
        ))}
      </ul>
    </div>
  );
}
