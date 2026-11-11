"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

/**
 * Shared flow state for a tool page.
 * stage 0 = add input, 1 = adjust / ready, 2 = export result.
 * The page shell renders the step rail; each tool reports its stage with useToolStage().
 */
interface ToolFlowContextValue {
  stage: number | null;
  setStage: (stage: number | null) => void;
}

const ToolFlowContext = createContext<ToolFlowContextValue>({
  stage: null,
  setStage: () => {},
});

export function ToolFlowProvider({ children }: { children: React.ReactNode }) {
  const [stage, setStage] = useState<number | null>(null);
  return <ToolFlowContext.Provider value={{ stage, setStage }}>{children}</ToolFlowContext.Provider>;
}

/** Called by a tool component to publish where the user currently is in the flow. */
export function useToolStage(stage: 0 | 1 | 2) {
  const { setStage } = useContext(ToolFlowContext);
  useEffect(() => {
    setStage(stage);
  }, [stage, setStage]);
  useEffect(() => () => setStage(null), [setStage]);
}

export function ToolStepper({ steps }: { steps: readonly string[] }) {
  const { stage } = useContext(ToolFlowContext);
  const shown = steps.slice(0, 3);
  return (
    <ol className="tool-steps" aria-label="Steps">
      {shown.map((text, i) => {
        const state =
          stage === null ? "idle" : i < stage ? "done" : i === stage ? "current" : "idle";
        return (
          <li
            key={i}
            className="tool-step"
            data-state={state}
            aria-current={state === "current" ? "step" : undefined}
          >
            <span className="tool-step__num" aria-hidden="true">
              {state === "done" ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : i + 1}
            </span>
            <span>{text}</span>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Wraps a results block. When `active` turns true (a result just appeared) the block is
 * scrolled into view and focused so keyboard / screen-reader users land on the output.
 */
export function ResultAnchor({
  active,
  children,
  label = "Result",
  className = "",
}: {
  active: boolean;
  children: React.ReactNode;
  label?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const wasActive = useRef(false);

  useEffect(() => {
    if (active && !wasActive.current && ref.current) {
      const el = ref.current;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const rect = el.getBoundingClientRect();
      // Only scroll when the result starts in the lower part of the viewport (or off-screen).
      if (rect.top > window.innerHeight * 0.55 || rect.top < 0) {
        const lenis = (window as unknown as {
          lenis?: { scrollTo: (t: HTMLElement, o: { offset: number; duration: number }) => void };
        }).lenis;
        if (lenis && !reduce) {
          lenis.scrollTo(el, { offset: -96, duration: 0.9 });
        } else {
          el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        }
      }
      el.focus({ preventScroll: true });
    }
    wasActive.current = active;
  }, [active]);

  if (!active) return null;
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="region"
      aria-label={label}
      className={`scroll-mt-28 outline-none ${className}`}
    >
      {children}
    </div>
  );
}

export function ProgressBar({
  done,
  total,
  label,
}: {
  done: number;
  total: number;
  label: string;
}) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="space-y-1.5" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label={label}>
      <div className="flex items-center justify-between text-xs font-semibold">
        <span>{label}</span>
        <span className="font-mono">
          {done}/{total}
        </span>
      </div>
      <div className="tool-progress">
        <div className="tool-progress__bar" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
