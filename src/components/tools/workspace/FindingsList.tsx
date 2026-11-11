"use client";

import React from "react";
import { Check, Undo2, AlertTriangle } from "lucide-react";

export interface ReviewItem {
  id: string;
  label: string;
  ruleOrType: string;
  location: string;
  beforeText: string;
  afterText?: string;
  accepted: boolean;
  reason?: string;
}

interface FindingsListProps {
  title: string;
  subtitle?: string;
  items: readonly ReviewItem[];
  onToggleItem?: (id: string) => void;
  emptyMessage: string;
}

export function FindingsList({
  title,
  subtitle,
  items,
  onToggleItem,
  emptyMessage,
}: FindingsListProps) {
  return (
    <section
      aria-label={title}
      className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface-muted)]/60 p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-base font-bold text-[var(--theme-heading)]">{title}</h2>
          {subtitle && <p className="text-xs text-[var(--theme-text-muted)] mt-0.5">{subtitle}</p>}
        </div>
        <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)]">
          {items.filter((i) => i.accepted).length} / {items.length} active
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-[var(--theme-text-muted)] py-3">{emptyMessage}</p>
      ) : (
        <ul
          data-lenis-prevent=""
          className="space-y-2 max-h-80 overflow-y-auto pr-1"
        >
          {items.map((item) => (
            <li
              key={item.id}
              className={`rounded-xl border p-3 text-xs transition-colors ${
                item.accepted
                  ? "bg-[var(--theme-surface)] border-[var(--theme-border)]"
                  : "bg-[var(--theme-surface)]/50 border-dashed border-[var(--theme-border)] opacity-70"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle
                    className="w-3.5 h-3.5 shrink-0 text-[var(--swatch-coral)]"
                    aria-hidden="true"
                  />
                  <span className="font-bold text-[var(--theme-text)]">{item.label}</span>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[var(--theme-surface-muted)] text-[var(--theme-text-muted)]">
                    {item.location}
                  </span>
                </div>

                {onToggleItem && (
                  <button
                    type="button"
                    onClick={() => onToggleItem(item.id)}
                    aria-pressed={item.accepted}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold cursor-pointer border transition-colors"
                    style={
                      item.accepted
                        ? {
                            backgroundColor: "var(--status-verified-bg)",
                            borderColor: "var(--status-verified-border)",
                            color: "var(--status-verified-fg)",
                          }
                        : {
                            backgroundColor: "var(--theme-surface-muted)",
                            borderColor: "var(--theme-border)",
                            color: "var(--theme-text-muted)",
                          }
                    }
                  >
                    {item.accepted ? (
                      <>
                        <Check className="w-3 h-3" aria-hidden="true" />
                        <span>Applied</span>
                      </>
                    ) : (
                      <>
                        <Undo2 className="w-3 h-3" aria-hidden="true" />
                        <span>Skipped — Restore</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                <div className="rounded-lg p-2 bg-[var(--status-finding-bg)]/60 text-[var(--status-finding-fg)] break-all">
                  <span className="font-sans font-bold uppercase tracking-wide text-[10px] block mb-0.5">
                    Before
                  </span>
                  {item.beforeText || "(empty)"}
                </div>
                {item.afterText !== undefined && (
                  <div className="rounded-lg p-2 bg-[var(--status-verified-bg)]/60 text-[var(--status-verified-fg)] break-all">
                    <span className="font-sans font-bold uppercase tracking-wide text-[10px] block mb-0.5">
                      After
                    </span>
                    {item.afterText || "(removed)"}
                  </div>
                )}
              </div>

              {item.reason && (
                <p className="mt-1.5 text-[11px] text-[var(--theme-text-muted)]">{item.reason}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

