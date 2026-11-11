"use client";

import React, { useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { calculateDateDifference, formatIsoDate, parseIsoDate } from "./dateMath";
import { useToolStage } from "@/components/tools/workspace/ToolFlow";

export function DateDifferenceTool() {
  const [startIso, setStartIso] = useState(() => {
    const d = new Date();
    return formatIsoDate({ year: d.getFullYear(), month: 1, day: 1 });
  });
  const [endIso, setEndIso] = useState(() => {
    const d = new Date();
    return formatIsoDate({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() });
  });
  const [inclusive, setInclusive] = useState(false);

  const calculation = useMemo(() => {
    const s = parseIsoDate(startIso);
    const e = parseIsoDate(endIso);
    if (!s || !e) return { error: "Please select valid start and end dates.", span: null };
    return { error: null, span: calculateDateDifference(s, e, inclusive) };
  }, [startIso, endIso, inclusive]);

  useToolStage(calculation ? 2 : 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
        <div className="sm:col-span-5">
          <label htmlFor="diff-start" className="text-sm font-semibold block mb-1.5">
            Start date
          </label>
          <input
            id="diff-start"
            type="date"
            value={startIso}
            onChange={(e) => setStartIso(e.target.value)}
            className="w-full tool-input"
          />
        </div>

        <div className="sm:col-span-2 flex justify-center">
          <button
            type="button"
            onClick={() => {
              setStartIso(endIso);
              setEndIso(startIso);
            }}
            aria-label="Swap start and end dates"
            className="px-3.5 py-2.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-muted)] hover:bg-[var(--swatch-accent-tint)] cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeftRight className="w-4 h-4" aria-hidden="true" />
            <span>Swap</span>
          </button>
        </div>

        <div className="sm:col-span-5">
          <label htmlFor="diff-end" className="text-sm font-semibold block mb-1.5">
            End date
          </label>
          <input
            id="diff-end"
            type="date"
            value={endIso}
            onChange={(e) => setEndIso(e.target.value)}
            className="w-full tool-input"
          />
        </div>
      </div>

      <label className="inline-flex items-center gap-2.5 text-sm font-medium cursor-pointer">
        <input
          type="checkbox"
          checked={inclusive}
          onChange={(e) => setInclusive(e.target.checked)}
          className="w-4 h-4 accent-[var(--swatch-accent)]"
        />
        <span>
          Inclusive count (include both start and end dates, adding 1 day to elapsed nights)
        </span>
      </label>

      {calculation.error && (
        <div
          role="alert"
          className="rounded-xl px-4 py-3 text-sm border"
          style={{
            color: "var(--status-finding-fg)",
            backgroundColor: "var(--status-finding-bg)",
            borderColor: "var(--status-finding-border)",
          }}
        >
          {calculation.error}
        </div>
      )}

      {calculation.span && (
        <div className="rounded-2xl border border-[var(--swatch-accent)]/35 bg-[var(--swatch-accent-tint)]/45 p-6 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--swatch-accent)]">
              {inclusive ? "Inclusive Calendar Span" : "Elapsed Calendar Difference (Exclusive)"}
            </span>
            {calculation.span.reversed && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--status-estimated-bg)] text-[var(--status-estimated-fg)]">
                End date is earlier than start date (showing absolute span)
              </span>
            )}
          </div>

          <p className="text-3xl sm:text-4xl font-bold font-mono text-[var(--theme-heading)]">
            {calculation.span.totalDays.toLocaleString()} days
          </p>
          <p className="text-sm text-[var(--theme-text-muted)]">
            Calendar breakdown:{" "}
            <strong className="font-mono text-[var(--theme-text)]">
              {calculation.span.years} years, {calculation.span.months} months,{" "}
              {calculation.span.days} days
            </strong>{" "}
            • {calculation.span.totalWeeks.toLocaleString()} weeks and{" "}
            {calculation.span.remainingDaysAfterWeeks} remaining days
          </p>
        </div>
      )}
    </div>
  );
}

