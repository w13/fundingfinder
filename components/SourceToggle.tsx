"use client";

import * as Switch from "@radix-ui/react-switch";
import * as Label from "@radix-ui/react-label";

export default function SourceToggle({ 
  formId,
  active 
}: { 
  formId: string;
  active: boolean;
}) {
  const handleToggle = () => {
    const form = document.getElementById(formId) as HTMLFormElement;
    if (form) {
      form.requestSubmit();
    }
  };

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
      <Switch.Root
        checked={active}
        onCheckedChange={handleToggle}
        style={{
          width: "44px",
          height: "24px",
          backgroundColor: active ? "var(--primary)" : "#cbd5e1",
          borderRadius: "0",
          position: "relative",
          cursor: "pointer",
          border: "none",
          padding: 0,
          transition: "background-color 0.2s ease"
        }}
      >
        <Switch.Thumb
          style={{
            display: "block",
            width: "20px",
            height: "20px",
            backgroundColor: "#ffffff",
            borderRadius: "0",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
            transition: "transform 0.2s ease",
            transform: active ? "translateX(20px)" : "translateX(2px)",
            willChange: "transform"
          }}
        />
      </Switch.Root>
      <Label.Root
        htmlFor={`toggle-input-${formId}`}
        style={{ 
          cursor: "pointer",
          color: active ? "var(--primary)" : "var(--muted)",
          fontWeight: active ? 600 : 400,
          fontSize: "12px"
        }}
        onClick={handleToggle}
      >
        {active ? "On" : "Off"}
      </Label.Root>
      <input
        id={`toggle-input-${formId}`}
        type="hidden"
        name="active"
        value={active ? "true" : "false"}
      />
    </div>
  );
}
