"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Copy, Download, Sparkles, Eraser, ArrowRight } from "lucide-react";
import { TextWorkspace } from "@/components/tools/workspace/TextWorkspace";
import { StatusAnnouncer } from "@/components/tools/workspace/StatusAnnouncer";
import { countTextStats, normalizeExtraSpaces } from "./wordCounterEngine";
import { triggerBlobDownload } from "@/lib/file-processing/filenames";
import { trackToolEvent } from "@/lib/analytics/tracker";
import { useToolStage } from "@/components/tools/workspace/ToolFlow";

const SAMPLE_TEXT = `Everyday Tools Hub runs completely in your browser.\n\nWhether you are drafting an application essay, checking product documentation, or preparing text for an AI assistant, clear measurement helps you stay within limits without sending drafts to third-party servers.`;

export function WordCounterTool() {
  const [text, setText] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  const stats = useMemo(() => countTextStats(text), [text]);

  const handleCopy = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setStatusMsg("Text copied to clipboard.");
    trackToolEvent("copy_result", { tool_id: "word-counter" });
  };

  const handleDownload = () => {
    if (!text) return;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    triggerBlobDownload(blob, "text-export.txt");
    setStatusMsg("Downloaded text file.");
    trackToolEvent("download", { tool_id: "word-counter", output_format: "txt" });
  };

  const handleCleanSpaces = () => {
    if (!text) return;
    const cleaned = normalizeExtraSpaces(text);
    setText(cleaned);
    setStatusMsg("Collapsed extra spaces and blank lines.");
    trackToolEvent("tool_success", { tool_id: "word-counter" });
  };

  useToolStage(text.trim() ? 2 : 0);

  return (
    <div className="space-y-6">
      <StatusAnnouncer message={statusMsg} />

      {/* Live Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Words", val: stats.words },
          { label: "Chars (with spaces)", val: stats.charactersWithSpaces },
          { label: "Chars (no spaces)", val: stats.charactersWithoutSpaces },
          { label: "Sentences", val: stats.sentences },
          { label: "Paragraphs", val: stats.paragraphs },
          {
            label: "Read / Speak",
            val: `${stats.readingTimeMinutes}m / ${stats.speakingTimeMinutes}m`,
          },
        ].map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface-muted)]/55 p-3.5"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-muted)]">
              {metric.label}
            </p>
            <p className="mt-1 text-xl sm:text-2xl font-bold font-mono text-[var(--theme-heading)]">
              {typeof metric.val === "number" ? metric.val.toLocaleString() : metric.val}
            </p>
          </div>
        ))}
      </div>

      <TextWorkspace
        value={text}
        onChange={setText}
        onClear={() => setStatusMsg("Workspace cleared.")}
        onLoadSample={() => {
          setText(SAMPLE_TEXT);
          setStatusMsg("Sample text loaded.");
        }}
        label="Text to measure"
        placeholder="Paste or type your text here for live word, character, sentence, and reading time counts..."
        rows={11}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={!text}
            onClick={handleCleanSpaces}
            className="tool-btn tool-btn--ghost"
          >
            <Eraser className="w-4 h-4" aria-hidden="true" />
            <span>Remove extra spaces</span>
          </button>
          <button
            type="button"
            disabled={!text}
            onClick={() => void handleCopy()}
            className="tool-btn"
          >
            <Copy className="w-4 h-4" aria-hidden="true" />
            <span>Copy text</span>
          </button>
          <button
            type="button"
            disabled={!text}
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] text-sm font-semibold disabled:opacity-45 cursor-pointer"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Download .txt</span>
          </button>
        </div>

        <Link
          href="/tools/token-counter"
          onClick={() =>
            trackToolEvent("ai_prep_cross_use", {
              source_tool_id: "word-counter",
              destination_tool_id: "token-counter",
            })
          }
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--swatch-sky)] no-underline hover:underline"
        >
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          <span>Estimate LLM tokens</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>

      {/* How we count explainer */}
      <details className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface-muted)]/35 p-4 text-xs sm:text-sm text-[var(--theme-text-muted)]">
        <summary className="font-semibold text-[var(--theme-text)] cursor-pointer">
          How we count words, characters &amp; reading time
        </summary>
        <ul className="mt-2.5 space-y-1.5 list-disc pl-5 leading-relaxed">
          <li>
            <strong>Words:</strong> Segmented via Unicode <code>Intl.Segmenter</code> word rules so
            contractions, accented letters, and CJK segments count reliably.
          </li>
          <li>
            <strong>Characters:</strong> Grapheme clusters so combined emojis count as one visible
            character rather than multiple UTF-16 code units.
          </li>
          <li>
            <strong>Reading / Speaking time:</strong> Estimated at 225 WPM reading and 130 WPM
            speaking.
          </li>
        </ul>
      </details>
    </div>
  );
}

