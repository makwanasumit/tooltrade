import React from "react";
import Link from "next/link";
import { CheckCircle2, SlidersHorizontal, Sparkles } from "lucide-react";
import type { AccuracyKind } from "@/lib/tools/types";

const CONFIG: Record<
  AccuracyKind,
  {
    label: string;
    fg: string;
    bg: string;
    border: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  exact: {
    label: "Exact",
    fg: "var(--status-exact-fg)",
    bg: "var(--status-exact-bg)",
    border: "var(--status-exact-border)",
    Icon: CheckCircle2,
  },
  estimated: {
    label: "Estimated",
    fg: "var(--status-estimated-fg)",
    bg: "var(--status-estimated-bg)",
    border: "var(--status-estimated-border)",
    Icon: SlidersHorizontal,
  },
  heuristic: {
    label: "Heuristic",
    fg: "var(--status-heuristic-fg)",
    bg: "var(--status-heuristic-bg)",
    border: "var(--status-heuristic-border)",
    Icon: Sparkles,
  },
};

export function AccuracyBadge({
  kind,
  explanation,
  asStatic = false,
}: {
  kind: AccuracyKind;
  explanation?: string;
  /** Render as a plain label (no link) — required when the badge sits inside another link/card. */
  asStatic?: boolean;
}) {
  const cfg = CONFIG[kind];
  const Icon = cfg.Icon;

  return (
    <div className="inline-flex flex-wrap items-center gap-2">
      {asStatic ? (
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-[1.5px]"
          style={{ color: cfg.fg, backgroundColor: cfg.bg, borderColor: cfg.fg }}
        >
          <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Accuracy: {cfg.label}</span>
        </span>
      ) : (
        <Link
          href="/accuracy"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-[1.5px] no-underline hover:opacity-90"
          style={{ color: cfg.fg, backgroundColor: cfg.bg, borderColor: cfg.fg }}
        >
          <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Accuracy: {cfg.label}</span>
        </Link>
      )}
      {explanation && (
        <span className="text-xs text-[var(--theme-text-muted)]">{explanation}</span>
      )}
    </div>
  );
}

