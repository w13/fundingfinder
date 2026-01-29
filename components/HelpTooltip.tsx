"use client";

import * as Tooltip from "@radix-ui/react-tooltip";

interface HelpTooltipProps {
  content: string;
}

export default function HelpTooltip({ content }: HelpTooltipProps) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            style={{
              background: "transparent",
              border: "none",
              cursor: "help",
              padding: "0",
              margin: "0",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "16px",
              height: "16px",
              color: "var(--text-secondary)",
              fontSize: "12px",
              lineHeight: "1",
              transition: "color 0.2s ease"
            }}
            aria-label="Help"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
            </svg>
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            sideOffset={8}
            style={{
              padding: "8px 12px",
              background: "#1e293b",
              color: "#fff",
              fontSize: "12px",
              lineHeight: "1.5",
              borderRadius: "0",
              whiteSpace: "normal",
              maxWidth: "300px",
              wordBreak: "break-word",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              zIndex: 1000
            }}
          >
            {content}
            <Tooltip.Arrow
              style={{
                fill: "#1e293b"
              }}
            />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
