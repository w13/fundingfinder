"use client";

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
    <label 
      htmlFor={`toggle-input-${formId}`}
      style={{ 
        display: "inline-flex", 
        alignItems: "center", 
        gap: "8px",
        cursor: "pointer",
        fontSize: "13px"
      }}
    >
      <input
        id={`toggle-input-${formId}`}
        type="checkbox"
        checked={active}
        onChange={handleToggle}
        style={{
          width: "44px",
          height: "24px",
          appearance: "none",
          backgroundColor: active ? "var(--primary)" : "#cbd5e1",
          borderRadius: "12px",
          position: "relative",
          cursor: "pointer",
          transition: "background-color 0.2s ease",
          margin: 0
        }}
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.backgroundColor = "#94a3b8";
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.backgroundColor = "#cbd5e1";
          }
        }}
      />
      <span style={{ 
        color: active ? "var(--primary)" : "var(--muted)",
        fontWeight: active ? 600 : 400,
        fontSize: "12px"
      }}>
        {active ? "On" : "Off"}
      </span>
    </label>
  );
}
