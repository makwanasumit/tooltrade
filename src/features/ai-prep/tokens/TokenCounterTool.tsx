"use client";

import React, { useEffect, useState } from "react";
import JSZip from "jszip";
import { Copy, Download, Scissors, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import modelsDataset from "@/lib/data/models.json";
import { TextWorkspace } from "@/components/tools/workspace/TextWorkspace";
import { DataFreshnessBanner } from "@/components/tools/badges/DataFreshnessBanner";
import { AccuracyBadge } from "@/components/tools/badges/AccuracyBadge";
import { StatusAnnouncer } from "@/components/tools/workspace/StatusAnnouncer";
import {
  calculateTokensForAllModels,
  splitTextIntoTokenChunks,
  type TextChunk,
  type TokenCountEstimate,
} from "./tokenEngine";
import { triggerBlobDownload } from "@/lib/file-processing/filenames";
import { trackToolEvent } from "@/lib/analytics/tracker";
import { useToolStage } from "@/components/tools/workspace/ToolFlow";

const SAMPLE_DOC = `# Quarterly Release Notes\n\nAll file conversions run inside local browser Web Workers.\n\n## Performance & Token Budget\nKeeping prompts focused saves latency and output budget. JSON and source code generally tokenize more densely than English prose.`;

export function TokenCounterTool() {
  const [text, setText] = useState("");
  const [reservedOutput, setReservedOutput] = useState(2048);
  const [callsCount, setCallsCount] = useState(1);
  const [selectedModelId, setSelectedModelId] = useState("gpt-4o");
  const [showBoundaries, setShowBoundaries] = useState(false);

  const [estimates, setEstimates] = useState<TokenCountEstimate[]>([]);
  const [tokenPieces, setTokenPieces] = useState<string[]>([]);

  const [chunkBudget, setChunkBudget] = useState(500);
  const [chunkOverlap, setChunkOverlap] = useState(50);
  const [chunks, setChunks] = useState<TextChunk[]>([]);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    calculateTokensForAllModels(text, reservedOutput).then((res) => {
      if (cancelled) return;
      setEstimates(res.results);
      setTokenPieces(res.sampleTokensForHighlight);
    });
    return () => {
      cancelled = true;
    };
  }, [text, reservedOutput]);

  const activeEstimate = estimates.find((e) => e.model.id === selectedModelId) ?? estimates[0];

  const handleChunkSplit = async () => {
    if (!text.trim()) return;
    const out = await splitTextIntoTokenChunks(text, chunkBudget, chunkOverlap);
    setChunks(out);
    setStatusMsg(`Split text into ${out.length} chunk(s).`);
    trackToolEvent("tool_success", { tool_id: "token-counter" });
  };

  const downloadChunksZip = async () => {
    const zip = new JSZip();
    chunks.forEach((c) => {
      zip.file(`chunk-${String(c.index).padStart(3, "0")}.txt`, c.text);
    });
    const blob = await zip.generateAsync({ type: "blob" });
    triggerBlobDownload(blob, "token-chunks.zip");
    trackToolEvent("download", { tool_id: "token-counter", output_format: "zip" });
  };

  useToolStage(text.trim() ? (estimates.length > 0 ? 2 : 1) : 0);

  return (
    <div className="space-y-6">
      <StatusAnnouncer message={statusMsg} />

      <DataFreshnessBanner
        assetName={modelsDataset.datasetName}
        reviewedAt={modelsDataset.reviewedAt}
        maxAgeDays={modelsDataset.maxAgeDays}
        sourceUrl="https://openai.com/api/pricing/"
      />

      <TextWorkspace
        value={text}
        onChange={(v) => {
          setText(v);
          setChunks([]);
        }}
        onClear={() => {
          setChunks([]);
          setStatusMsg("Cleared token calculator.");
        }}
        onLoadSample={() => setText(SAMPLE_DOC)}
        sampleLabel="Load sample markdown"
        label="Prompt, code, or document text"
        placeholder="Paste text, Markdown, CSV, or JSON to calculate Exact OpenAI BPE counts and Estimated Claude/Gemini ranges..."
        rows={9}
        acceptedExtensions=".txt,.md,.json,.csv"
      />

      {/* Context Controls & Primary Fit Bar */}
      <div className="tool-panel space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="tok-model" className="tool-label">
              Target model for Context Fit
            </label>
            <select
              id="tok-model"
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="w-full tool-input"
            >
              {modelsDataset.models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.accuracy === "exact" ? "Exact" : "Estimated"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tok-output" className="tool-label">
              Reserve output tokens
            </label>
            <input
              id="tok-output"
              type="number"
              min={0}
              max={128000}
              value={reservedOutput}
              onChange={(e) => setReservedOutput(Math.max(0, Number(e.target.value)))}
              className="w-full tool-input tool-input--mono"
            />
          </div>

          <div>
            <label htmlFor="tok-calls" className="tool-label">
              Cost multiplier (N calls)
            </label>
            <input
              id="tok-calls"
              type="number"
              min={1}
              max={1000000}
              value={callsCount}
              onChange={(e) => setCallsCount(Math.max(1, Number(e.target.value)))}
              className="w-full tool-input tool-input--mono"
            />
          </div>
        </div>

        {activeEstimate && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2 font-bold">
                {activeEstimate.fitStatus === "fits" && (
                  <CheckCircle2 className="w-4 h-4 text-[var(--status-verified-fg)]" aria-hidden="true" />
                )}
                {activeEstimate.fitStatus === "tight" && (
                  <AlertTriangle className="w-4 h-4 text-[var(--status-estimated-fg)]" aria-hidden="true" />
                )}
                {activeEstimate.fitStatus === "exceeds" && (
                  <XCircle className="w-4 h-4 text-[var(--status-finding-fg)]" aria-hidden="true" />
                )}
                <span>
                  {activeEstimate.fitStatus === "fits"
                    ? "Fits comfortably"
                    : activeEstimate.fitStatus === "tight"
                      ? "Tight fit (≥80% window)"
                      : "Exceeds context window"}
                </span>
                <AccuracyBadge kind={activeEstimate.accuracy} />
              </div>

              <span className="font-mono text-xs text-[var(--theme-text-muted)]">
                {activeEstimate.accuracy === "exact"
                  ? `${activeEstimate.tokens.toLocaleString()} tokens`
                  : `~${activeEstimate.tokens.toLocaleString()} (${activeEstimate.minTokens.toLocaleString()}–${activeEstimate.maxTokens.toLocaleString()})`}{" "}
                / {(activeEstimate.model.contextWindow - reservedOutput).toLocaleString()} available
              </span>
            </div>

            <div className="h-3 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)] overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, activeEstimate.utilizationPct)}%`,
                  backgroundColor:
                    activeEstimate.fitStatus === "exceeds"
                      ? "var(--status-finding-fg)"
                      : activeEstimate.fitStatus === "tight"
                        ? "var(--swatch-volt)"
                        : "var(--swatch-accent)",
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Model Comparison Table */}
      <div className="overflow-x-auto rounded-2xl border border-[var(--theme-border)]">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-[var(--theme-surface-muted)]/70 text-[var(--theme-text)]">
            <tr>
              <th className="py-3 px-4 font-semibold">Model</th>
              <th className="py-3 px-4 font-semibold">Accuracy</th>
              <th className="py-3 px-4 font-semibold">Input Tokens</th>
              <th className="py-3 px-4 font-semibold">Context Fit</th>
              <th className="py-3 px-4 font-semibold">Est. Input Cost ({callsCount}×)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--theme-border)] bg-[var(--theme-surface)]">
            {estimates.map((row) => (
              <tr key={row.model.id}>
                <td className="py-3 px-4">
                  <p className="font-semibold">{row.model.name}</p>
                  <p className="text-[11px] text-[var(--theme-text-muted)]">{row.methodLabel}</p>
                </td>
                <td className="py-3 px-4">
                  <AccuracyBadge kind={row.accuracy} />
                </td>
                <td className="py-3 px-4 font-mono">
                  {row.accuracy === "exact"
                    ? row.tokens.toLocaleString()
                    : `${row.minTokens.toLocaleString()}–${row.maxTokens.toLocaleString()}`}
                </td>
                <td className="py-3 px-4 font-mono text-xs">
                  {row.utilizationPct}% ({row.fitStatus})
                </td>
                <td className="py-3 px-4 font-mono">
                  ${(row.estimatedInputCostUsd * callsCount).toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Optional Token Boundary Preview */}
      {text.length > 0 && (
        <div className="space-y-2">
          <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={showBoundaries}
              onChange={(e) => setShowBoundaries(e.target.checked)}
              className="accent-[var(--swatch-accent)]"
            />
            <span>Highlight OpenAI (o200k_base) token boundaries (first 220 tokens)</span>
          </label>
          {showBoundaries && (
            <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 font-mono text-xs leading-loose flex flex-wrap gap-1">
              {tokenPieces.map((tok, i) => (
                <span
                  key={i}
                  className="px-1 rounded"
                  style={{
                    backgroundColor:
                      i % 3 === 0
                        ? "var(--swatch-accent-tint)"
                        : i % 3 === 1
                          ? "var(--swatch-sky-tint)"
                          : "var(--swatch-volt-tint)",
                  }}
                >
                  {tok.replace(/\n/g, "↵\n")}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Heading & Paragraph-Aware Chunk Splitter */}
      <section className="tool-panel space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold">Chunk Splitter (Heading &amp; Paragraph Aware)</h2>
            <p className="text-xs text-[var(--theme-text-muted)]">
              Split long documents into token-bounded chunks with configurable overlap.
            </p>
          </div>
          {chunks.length > 1 && (
            <button
              type="button"
              onClick={() => void downloadChunksZip()}
              className="tool-btn tool-btn--coral tool-btn--sm"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Download Chunks (.zip)</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="chunk-budget" className="tool-label">
              Tokens per chunk
            </label>
            <input
              id="chunk-budget"
              type="number"
              min={50}
              max={64000}
              value={chunkBudget}
              onChange={(e) => setChunkBudget(Math.max(50, Number(e.target.value)))}
              className="w-32 tool-input tool-input--mono"
            />
          </div>
          <div>
            <label htmlFor="chunk-overlap" className="tool-label">
              Overlap tokens
            </label>
            <input
              id="chunk-overlap"
              type="number"
              min={0}
              max={2000}
              value={chunkOverlap}
              onChange={(e) => setChunkOverlap(Math.max(0, Number(e.target.value)))}
              className="w-32 tool-input tool-input--mono"
            />
          </div>
          <button
            type="button"
            disabled={!text.trim()}
            onClick={() => void handleChunkSplit()}
            className="tool-btn tool-btn--sm"
          >
            <Scissors className="w-4 h-4" aria-hidden="true" />
            <span>Split into Chunks</span>
          </button>
        </div>

        {chunks.length > 0 && (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1" data-lenis-prevent="">
            {chunks.map((c) => (
              <div
                key={c.index}
                className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">
                    Chunk {c.index} ({c.estimatedTokens} tokens)
                  </span>
                  <button
                    type="button"
                    onClick={() => void navigator.clipboard.writeText(c.text)}
                    className="tool-btn tool-btn--ghost tool-btn--sm"
                  >
                    <Copy className="w-3 h-3" aria-hidden="true" />
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="whitespace-pre-wrap font-mono text-[11px] text-[var(--theme-text-muted)]">
                  {c.text}
                </pre>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

