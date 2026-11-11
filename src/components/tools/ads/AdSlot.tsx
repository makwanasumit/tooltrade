import React from "react";

interface AdSlotProps {
  slotId: string;
  placement: "below-tool" | "sidebar" | "guide-footer";
}

/**
 * Reserved, policy-compliant ad container.
 * Remains completely hidden until NEXT_PUBLIC_ADSENSE_ENABLED="true" after approval.
 * Never rendered inside "What changed", findings lists, dropzones, or restore steps (PRD §13.2).
 */
export function AdSlot({ slotId, placement }: AdSlotProps) {
  const enabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true";
  if (!enabled) return null;

  return (
    <aside
      aria-label="Advertisement"
      data-ad-slot={slotId}
      data-ad-placement={placement}
      className="my-6 min-h-[100px] rounded-2xl border border-dashed border-[var(--theme-border)] bg-[var(--theme-surface-muted)]/40 flex items-center justify-center text-xs text-[var(--theme-text-muted)]"
    >
      <span>Advertisement ({slotId})</span>
    </aside>
  );
}

