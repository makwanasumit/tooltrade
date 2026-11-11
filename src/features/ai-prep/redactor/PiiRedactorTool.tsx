"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Copy, RotateCcw, Download, AlertTriangle, PlusCircle } from "lucide-react";
import { TextWorkspace } from "@/components/tools/workspace/TextWorkspace";
import { FindingsList, type ReviewItem } from "@/components/tools/workspace/FindingsList";
import { StatusAnnouncer } from "@/components/tools/workspace/StatusAnnouncer";
import { buildRedactionPlan, restoreRedactedReply } from "./redactorEngine";
import { triggerBlobDownload } from "@/lib/file-processing/filenames";
import { bucketFindingCount, trackToolEvent } from "@/lib/analytics/tracker";
import { useToolStage } from "@/components/tools/workspace/ToolFlow";

const SAMPLE_PROMPT = `Hi team, please debug the webhook failure for customer priya.nair@acme-ops.example.
Phone: +1-415-555-0192 | Server IP: 192.168.14.22
Stripe key: demo_api_key_ABCDEFGHIJKLMNOPQRSTUVWXYZ123456
IBAN refund destination: DE89 3704 0044 0532 0130 00`;

export function PiiRedactorTool() {
  const [sourceText, setSourceText] = useState("");
  const [style, setStyle] = useState<"labelled" | "generic">("labelled");
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());
  const [manualSpans, setManualSpans] = useState<
    Array<{ id: string; start: number; end: number; value: string }>
  >([]);
  const [customPhrase, setCustomPhrase] = useState("");
  const [aiReply, setAiReply] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  // Single memory-only mapping ref scrubbed on reset, unmount, or pagehide
  const memoryMapRef = useRef<Map<string, string>>(new Map());

  const plan = useMemo(
    () => buildRedactionPlan(sourceText, rejectedIds, manualSpans, style),
    [sourceText, rejectedIds, manualSpans, style],
  );

  useEffect(() => {
    memoryMapRef.current = plan.placeholderToOriginal;
  }, [plan.placeholderToOriginal]);

  const scrubMemory = () => {
    memoryMapRef.current.clear();
    setSourceText("");
    setRejectedIds(new Set());
    setManualSpans([]);
    setAiReply("");
    setCustomPhrase("");
    setStatusMsg("Text and in-memory restore map scrubbed.");
  };

  useEffect(() => {
    const onPageHide = () => {
      memoryMapRef.current.clear();
    };
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      memoryMapRef.current.clear();
    };
  }, []);

  const reviewItems: ReviewItem[] = useMemo(
    () =>
      plan.findings.map((f) => ({
        id: f.id,
        label: f.label,
        ruleOrType: f.detectorId,
        location: `offset ${f.start}–${f.end}`,
        beforeText: f.value,
        afterText: f.placeholder,
        accepted: f.accepted,
        reason:
          f.accuracy === "exact"
            ? "Deterministic pattern/checksum match"
            : "Heuristic pattern match — verify manually",
      })),
    [plan.findings],
  );

  const restoreResult = useMemo(
    () => restoreRedactedReply(aiReply, plan.placeholderToOriginal),
    [aiReply, plan.placeholderToOriginal],
  );

  const handleToggleFinding = (id: string) => {
    setRejectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddManualPhrase = () => {
    const phrase = customPhrase.trim();
    if (!phrase || !sourceText) return;
    let searchFrom = 0;
    const added: Array<{ id: string; start: number; end: number; value: string }> = [];
    while (true) {
      const idx = sourceText.indexOf(phrase, searchFrom);
      if (idx === -1) break;
      added.push({
        id: `manual:${idx}:${idx + phrase.length}`,
        start: idx,
        end: idx + phrase.length,
        value: phrase,
      });
      searchFrom = idx + phrase.length;
    }
    if (added.length > 0) {
      setManualSpans((prev) => [...prev, ...added]);
      setCustomPhrase("");
      setStatusMsg(`Manually masked ${added.length} occurrence(s) of custom phrase.`);
    }
  };

  useToolStage(aiReply.trim() ? 2 : sourceText.trim() ? 1 : 0);

  return (
    <div className="space-y-6">
      <StatusAnnouncer message={statusMsg} />

      {/* Required Honesty & Limitation Banner (PRD §7.3) */}
      <div
        className="rounded-2xl px-4 py-3.5 text-xs sm:text-sm border flex items-start gap-2.5"
        style={{
          color: "var(--status-estimated-fg)",
          backgroundColor: "var(--status-estimated-bg)",
          borderColor: "var(--status-estimated-border)",
        }}
      >
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1">
          <p className="font-bold">
            This tool finds common patterns. It can miss things. Review the result before sharing.
          </p>
          <p>
            <strong>Not detected automatically:</strong> personal names, company names, and
            free-form street addresses. Use &ldquo;Mask custom phrase&rdquo; below before copying
            to an external chatbot.
          </p>
        </div>
      </div>

      {/* Step 1: Input & Masked Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-3">
          <TextWorkspace
            value={sourceText}
            onChange={(next) => {
              setSourceText(next);
              if (next.trim()) {
                const p = buildRedactionPlan(next, rejectedIds, manualSpans, style);
                trackToolEvent("detector_run", {
                  tool_id: "pii-redactor",
                  finding_count_bucket: bucketFindingCount(p.findings.length),
                });
              }
            }}
            onClear={scrubMemory}
            onLoadSample={() => {
              setRejectedIds(new Set());
              setManualSpans([]);
              setSourceText(SAMPLE_PROMPT);
              setStatusMsg("Sample prompt loaded with synthetic PII.");
            }}
            sampleLabel="Load synthetic sample"
            label="1. Original text (stays in browser memory)"
            placeholder="Paste emails, support logs, contracts, or snippets containing secrets..."
            rows={10}
            acceptedExtensions=".txt,.md,.csv,.log"
          />

          {/* Manual Phrase Masking Control */}
          <div className="flex flex-wrap gap-2">
            <label htmlFor="manual-redact-phrase" className="sr-only">
              Mask a custom name or phrase manually
            </label>
            <input
              id="manual-redact-phrase"
              type="text"
              value={customPhrase}
              onChange={(e) => setCustomPhrase(e.target.value)}
              placeholder="Mask name, company, or phrase manually..."
              className="flex-1 min-w-48 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-2 text-xs"
            />
            <button
              type="button"
              disabled={!customPhrase.trim() || !sourceText}
              onClick={handleAddManualPhrase}
              className="tool-btn tool-btn--ink tool-btn--sm"
            >
              <PlusCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Mask Phrase</span>
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold">Redacted output to paste into AI</span>
            <select
              aria-label="Placeholder style"
              value={style}
              onChange={(e) => setStyle(e.target.value as "labelled" | "generic")}
              className="rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-1 text-xs font-medium"
            >
              <option value="labelled">Labelled ([EMAIL_1], [API_KEY_1])</option>
              <option value="generic">Generic ([REDACTED_1])</option>
            </select>
          </div>

          <textarea
            readOnly
            data-lenis-prevent=""
            rows={10}
            value={plan.maskedText}
            aria-label="Redacted output"
            placeholder="Masked text with reversible placeholders appears here..."
            className="tool-input tool-input--mono resize-y leading-relaxed !p-4"
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!plan.maskedText}
              onClick={async () => {
                await navigator.clipboard.writeText(plan.maskedText);
                setStatusMsg("Masked text copied.");
                trackToolEvent("copy_result", { tool_id: "pii-redactor" });
              }}
              className="tool-btn tool-btn--sm"
            >
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Copy Masked Text</span>
            </button>

            <button
              type="button"
              disabled={plan.placeholderToOriginal.size === 0}
              onClick={() => {
                const obj = Object.fromEntries(plan.placeholderToOriginal.entries());
                triggerBlobDownload(
                  new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" }),
                  "sensitive-restore-mapping.json",
                );
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[var(--status-finding-border)] text-[var(--status-finding-fg)] text-xs font-semibold disabled:opacity-45 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Download mapping (contains sensitive values!)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Findings Summary & Review Panel */}
      {sourceText.trim() && (
        <FindingsList
          title="Detected Items & Review"
          subtitle="Toggle individual findings on or off. Identical values receive the same placeholder."
          items={reviewItems}
          onToggleItem={handleToggleFinding}
          emptyMessage="No matching PII or secret patterns found. Remember: names and street addresses are not auto-detected."
        />
      )}

      {/* Step 2: Restore Originals in AI Reply */}
      <section
        aria-label="Restore placeholders in AI reply"
        className="tool-panel space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold">2. Restore Originals in AI Reply</h2>
            <p className="text-xs text-[var(--theme-text-muted)]">
              Paste your chatbot&apos;s reply containing placeholders like <code>[EMAIL_1]</code>.
              Swaps back locally using the temporary in-memory map.
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)]">
            {plan.placeholderToOriginal.size} mapping(s) in memory
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <textarea
            data-lenis-prevent=""
            rows={6}
            value={aiReply}
            onChange={(e) => setAiReply(e.target.value)}
            aria-label="Paste AI reply with placeholders"
            placeholder="Paste the AI response containing [EMAIL_1], [API_KEY_1]..."
            className="tool-input tool-input--mono resize-y leading-relaxed"
          />
          <div className="space-y-2">
            <textarea
              readOnly
              data-lenis-prevent=""
              rows={6}
              value={restoreResult.restoredText}
              aria-label="Restored reply"
              placeholder="Restored text appears here..."
              className="tool-input tool-input--mono resize-y leading-relaxed"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-[var(--theme-text-muted)]">
                Restored {restoreResult.restoredCount} placeholder occurrence(s).
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!restoreResult.restoredText}
                  onClick={() => void navigator.clipboard.writeText(restoreResult.restoredText)}
                  className="tool-btn tool-btn--sm"
                >
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Copy Restored</span>
                </button>
                <button
                  type="button"
                  onClick={scrubMemory}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Scrub Session</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

