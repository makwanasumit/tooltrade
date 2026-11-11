"use client";

import React, { useState } from "react";
import { ArrowUp, ArrowDown, Trash2, Download, FilePlus2, RefreshCw } from "lucide-react";
import { FileDropzone } from "@/components/tools/workspace/FileDropzone";
import { StatusAnnouncer } from "@/components/tools/workspace/StatusAnnouncer";
import { ResultAnchor, useToolStage } from "@/components/tools/workspace/ToolFlow";
import { inspectPdfBytes } from "./pdfProcessor";
import { runPdfWorker } from "./runPdfWorker";
import { formatBytes, triggerBlobDownload } from "@/lib/file-processing/filenames";
import { trackToolEvent } from "@/lib/analytics/tracker";

interface PdfQueueItem {
  id: string;
  file: File;
  pageCount: number;
  buffer: ArrayBuffer;
}

export function MergePdfTool() {
  const [items, setItems] = useState<PdfQueueItem[]>([]);
  const [stripMetadata, setStripMetadata] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [mergedOutput, setMergedOutput] = useState<{ blob: Blob; pageCount: number } | null>(null);

  useToolStage(mergedOutput ? 2 : items.length > 0 ? 1 : 0);

  const handleFilesAccepted = async (files: File[]) => {
    setErrorMsg(null);
    setMergedOutput(null);
    const added: PdfQueueItem[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        const buffer = await file.arrayBuffer();
        const { pageCount } = await inspectPdfBytes(buffer);
        added.push({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          pageCount,
          buffer,
        });
      } catch (err) {
        errors.push(`"${file.name}": ${err instanceof Error ? err.message : "Invalid PDF"}`);
      }
    }

    if (errors.length > 0) setErrorMsg(errors.join(" "));
    if (added.length > 0) {
      setItems((prev) => [...prev, ...added]);
      setStatusMsg(`Added ${added.length} PDF file(s).`);
    }
  };

  const moveItem = (index: number, delta: -1 | 1) => {
    const nextIdx = index + delta;
    if (nextIdx < 0 || nextIdx >= items.length) return;
    setMergedOutput(null);
    setItems((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      if (item) copy.splice(nextIdx, 0, item);
      return copy;
    });
  };

  const removeItem = (id: string) => {
    setMergedOutput(null);
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleMerge = async () => {
    if (items.length < 2) {
      setErrorMsg("Add at least two PDF files to merge.");
      return;
    }
    const totalSize = items.reduce((s, i) => s + i.file.size, 0);
    if (totalSize > 100 * 1024 * 1024) {
      setErrorMsg("Combined files exceed the 100 MB browser merge limit.");
      return;
    }

    setProcessing(true);
    setErrorMsg(null);
    setMergedOutput(null);
    trackToolEvent("tool_start", { tool_id: "merge-pdf" });

    try {
      const res = await runPdfWorker<{ blob: Blob; pageCount: number }>({
        action: "merge",
        files: items.map((i) => ({ name: i.file.name, buffer: i.buffer.slice(0) })),
        stripMetadata,
      });
      setMergedOutput(res);
      setStatusMsg(`Merged ${res.pageCount} pages into one PDF.`);
      trackToolEvent("tool_success", { tool_id: "merge-pdf" });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "PDF merge failed.");
      trackToolEvent("tool_error", { tool_id: "merge-pdf", error_code: "merge_failed" });
    } finally {
      setProcessing(false);
    }
  };

  const totalPages = items.reduce((sum, i) => sum + i.pageCount, 0);

  return (
    <div className="space-y-6">
      <StatusAnnouncer message={statusMsg} />

      <FileDropzone
        acceptAttr="application/pdf"
        allowedKinds={["pdf"]}
        maxFileBytes={50 * 1024 * 1024}
        maxFiles={25}
        multiple
        label="Drop two or more PDF files to combine"
        helperText="Max 50 MB per PDF (100 MB combined). Reorder by keyboard or buttons."
        onFilesAccepted={(files) => void handleFilesAccepted(files)}
        disabled={processing}
        mode="add"
        count={items.length}
      />

      {items.length > 0 && (
        <div className="tool-panel space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">
              {items.length} PDF(s) • {totalPages} total pages
            </p>
            <button
              type="button"
              onClick={() => {
                setItems([]);
                setMergedOutput(null);
                setErrorMsg(null);
              }}
              className="text-xs font-semibold text-[var(--status-finding-fg)] cursor-pointer"
            >
              Clear all
            </button>
          </div>

          <ul className="space-y-2" aria-label="PDF merge order">
            {items.map((item, idx) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border-[1.5px] border-[var(--swatch-ink)] bg-[var(--theme-surface)] px-4 py-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">
                    {idx + 1}. {item.file.name}
                  </p>
                  <p className="text-xs font-mono text-[var(--theme-text-muted)]">
                    {item.pageCount} {item.pageCount === 1 ? "page" : "pages"} •{" "}
                    {formatBytes(item.file.size)}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveItem(idx, -1)}
                    aria-label={`Move ${item.file.name} up`}
                    className="p-2 rounded-lg border border-[var(--theme-border)] disabled:opacity-35 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === items.length - 1}
                    onClick={() => moveItem(idx, 1)}
                    aria-label={`Move ${item.file.name} down`}
                    className="p-2 rounded-lg border border-[var(--theme-border)] disabled:opacity-35 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.file.name}`}
                    className="p-2 rounded-lg border border-[var(--status-finding-border)] text-[var(--status-finding-fg)] cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={stripMetadata}
              onChange={(e) => setStripMetadata(e.target.checked)}
              className="accent-[var(--swatch-accent)]"
            />
            <span>Drop document author, creator &amp; title metadata from the merged PDF</span>
          </label>

          <div>
            <button
              type="button"
              disabled={processing || items.length < 2}
              onClick={() => void handleMerge()}
              className="tool-btn"
            >
              {processing ? (
                <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <FilePlus2 className="w-4 h-4" aria-hidden="true" />
              )}
              <span>{processing ? "Merging PDFs..." : "Merge PDFs"}</span>
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="rounded-xl px-4 py-3 text-sm border"
          style={{
            color: "var(--status-finding-fg)",
            backgroundColor: "var(--status-finding-bg)",
            borderColor: "var(--status-finding-border)",
          }}
        >
          {errorMsg}
        </div>
      )}

      <ResultAnchor active={Boolean(mergedOutput)} label="Merged PDF">
        {mergedOutput && (
        <div className="tool-result flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-bold text-sm">Merged PDF ready</p>
            <p className="text-xs font-mono mt-0.5">
              {mergedOutput.pageCount} pages • {formatBytes(mergedOutput.blob.size)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerBlobDownload(mergedOutput.blob, "merged-document.pdf");
              trackToolEvent("download", { tool_id: "merge-pdf", output_format: "pdf" });
            }}
            className="tool-btn"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Download Merged PDF</span>
          </button>
        </div>
      )}
      </ResultAnchor>
    </div>
  );
}

