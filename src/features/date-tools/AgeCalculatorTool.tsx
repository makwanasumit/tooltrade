"use client";

import React, { useMemo, useState } from "react";
import { Calendar } from "lucide-react";
import { calculateAge, formatIsoDate, parseIsoDate } from "./dateMath";
import { useToolStage } from "@/components/tools/workspace/ToolFlow";

function getTodayIso(): string {
  const now = new Date();
  return formatIsoDate({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  });
}

export function AgeCalculatorTool() {
  const [birthIso, setBirthIso] = useState("1998-06-15");
  const [asOfIso, setAsOfIso] = useState(() => getTodayIso());
  const [feb29Rule, setFeb29Rule] = useState<"mar-1" | "feb-28">("mar-1");

  const calculation = useMemo(() => {
    const birth = parseIsoDate(birthIso);
    const asOf = parseIsoDate(asOfIso);
    if (!birth || !asOf) {
      return { error: "Please enter valid YYYY-MM-DD dates.", result: null };
    }
    const result = calculateAge(birth, asOf, feb29Rule);
    if (!result) {
      return {
        error: "Birth date cannot be later than the 'Calculate as of' date.",
        result: null,
      };
    }
    return { error: null, result };
  }, [birthIso, asOfIso, feb29Rule]);

  useToolStage(calculation ? 2 : 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="age-birth" className="text-sm font-semibold block mb-1.5">
            Date of birth
          </label>
          <input
            id="age-birth"
            type="date"
            value={birthIso}
            onChange={(e) => setBirthIso(e.target.value)}
            className="w-full tool-input"
          />
        </div>

        <div>
          <label htmlFor="age-asof" className="text-sm font-semibold block mb-1.5">
            Calculate as of
          </label>
          <input
            id="age-asof"
            type="date"
            value={asOfIso}
            onChange={(e) => setAsOfIso(e.target.value)}
            className="w-full tool-input"
          />
        </div>

        <div>
          <label htmlFor="age-feb29" className="text-sm font-semibold block mb-1.5">
            Feb-29 non-leap year convention
          </label>
          <select
            id="age-feb29"
            value={feb29Rule}
            onChange={(e) => setFeb29Rule(e.target.value as "mar-1" | "feb-28")}
            className="w-full tool-input"
          >
            <option value="mar-1">Observe on March 1 (default)</option>
            <option value="feb-28">Observe on February 28</option>
          </select>
        </div>
      </div>

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

      {calculation.result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 rounded-2xl border border-[var(--swatch-accent)]/35 bg-[var(--swatch-accent-tint)]/45 p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--swatch-accent)]">
              Exact Calendar Age
            </p>
            <p className="mt-2 text-2xl sm:text-4xl font-bold font-mono text-[var(--theme-heading)]">
              {calculation.result.span.years} yrs, {calculation.result.span.months} mos,{" "}
              {calculation.result.span.days} days
            </p>
            <p className="mt-2 text-sm text-[var(--theme-text-muted)]">
              Total elapsed calendar days:{" "}
              <strong className="font-mono text-[var(--theme-text)]">
                {calculation.result.span.totalDays.toLocaleString()}
              </strong>{" "}
              ({calculation.result.span.totalWeeks.toLocaleString()} weeks,{" "}
              {calculation.result.span.remainingDaysAfterWeeks} days)
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface-muted)]/55 p-6 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
              <Calendar className="w-4 h-4 text-[var(--swatch-coral)]" aria-hidden="true" />
              <span>Next Birthday</span>
            </div>
            <p className="mt-2 text-2xl font-bold font-mono text-[var(--theme-heading)]">
              {calculation.result.daysUntilNextBirthday} days
            </p>
            <p className="text-xs text-[var(--theme-text-muted)] mt-1">
              Falls on <span className="font-mono">{calculation.result.nextBirthdayIso}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

