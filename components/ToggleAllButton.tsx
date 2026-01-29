"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as Switch from "@radix-ui/react-switch";
import * as Label from "@radix-ui/react-label";
import { useErrorLogger } from "../lib/errors/useErrorLogger";

interface ToggleAllButtonProps {
  action: (formData: FormData) => Promise<void>;
  allActive: boolean;
  totalCount: number;
}

export default function ToggleAllButton({ action, allActive, totalCount }: ToggleAllButtonProps) {
  const { logError } = useErrorLogger("ToggleAllButton");
  const router = useRouter();
  const [isToggling, setIsToggling] = useState(false);
  const [isPending, startTransition] = useTransition();
  // Local state that updates immediately for optimistic UI
  const [localState, setLocalState] = useState<boolean>(allActive);

  // Sync local state with prop when it changes (after server revalidation)
  useEffect(() => {
    setLocalState(allActive);
  }, [allActive]);

  const isLoading = isToggling || isPending;

  const handleToggle = useCallback((checked: boolean) => {
    console.log(`ToggleAllButton: handleToggle called with checked=${checked}, current localState=${localState}, allActive=${allActive}`);
    
    // Prevent toggling if already in the desired state
    if (checked === localState) {
      console.log(`ToggleAllButton: Already in desired state (${localState}), skipping`);
      return;
    }
    
    // Update local state immediately using function form to ensure we get the latest value
    setLocalState((prev) => {
      console.log(`ToggleAllButton: Updating localState from ${prev} to ${checked}`);
      return checked;
    });
    setIsToggling(true);
    const formData = new FormData();
    formData.append("active", checked ? "true" : "false");
    
    startTransition(async () => {
      try {
        console.log(`ToggleAllButton: Calling action with active=${checked}`);
        await action(formData);
        console.log(`ToggleAllButton: Action completed successfully`);
        
        // Wait a bit for the server to process, then refresh
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Refresh the page data after successful action
        router.refresh();
        
        setTimeout(() => {
          setIsToggling(false);
        }, 500);
      } catch (error) {
        console.error("ToggleAllButton: Action failed", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        logError(error instanceof Error ? error : new Error(String(error)), "high", {
          action: "toggleAll",
          errorMessage
        });
        // Don't revert immediately - keep the optimistic state for a moment to show what was attempted
        // Then revert after a delay so user can see the error
        setTimeout(() => {
          setLocalState(allActive);
          setIsToggling(false);
        }, 1000);
      }
    });
  }, [action, router, allActive, localState, logError]);

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
      <Switch.Root
        checked={localState}
        onCheckedChange={handleToggle}
        disabled={isLoading}
        style={{
          width: "44px",
          height: "24px",
          backgroundColor: localState ? "var(--primary)" : "#cbd5e1",
          borderRadius: "0",
          position: "relative",
          cursor: isLoading ? "not-allowed" : "pointer",
          border: "none",
          padding: 0,
          transition: "background-color 0.2s ease",
          opacity: isLoading ? 0.7 : 1
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
            transform: localState ? "translateX(20px)" : "translateX(2px)",
            willChange: "transform"
          }}
        />
      </Switch.Root>
      <Label.Root
        htmlFor="toggle-all-input"
        style={{ 
          cursor: isLoading ? "not-allowed" : "pointer",
          color: localState ? "var(--primary)" : "var(--muted)",
          fontWeight: localState ? 600 : 400,
          fontSize: "12px",
          opacity: isLoading ? 0.7 : 1
        }}
        onClick={isLoading ? undefined : () => handleToggle(!localState)}
      >
        {localState ? "On" : "Off"}
      </Label.Root>
      <input
        id="toggle-all-input"
        type="hidden"
        name="active"
        value={localState ? "true" : "false"}
      />
    </div>
  );
}
