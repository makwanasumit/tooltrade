"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Download, Scissors, RefreshCw, Check, FileText } from "lucide-react";
import { FileDropzone } from "@/components/tools/workspace/FileDropzone";
import { StatusAnnouncer } from "@/components/tools/workspace/StatusAnnouncer";
import { ResultAnchor, useToolStage } from "@/components/tools/workspace/ToolFlow";
import { inspectPdfBytes, parsePageRangeExpression } from "./pdfProcessor";
import { runPdfWorker } from "./runPdfWorker";
import { usePdfPreview, type PdfPagePreview } from "./usePdfPreview";
import { formatBytes, triggerBlobDownload } from "@/lib/file-processing/filenames";
import { trackToolEvent } from "@/lib/analytics/tracker";

interface PageTileProps {
  pageNumber: number;
  /** 1-based position in the output, or 0 when the page is not selected */
  position: number;
  previewReady: boolean;
  renderPage: (n: number) => Promise<PdfPagePreview | null>;
  disabled: boolean;
  onToggle: (pageNumber: number, shiftKey: boolean) => void;
}

/** One page thumbnail. Renders lazily when it scrolls near the viewport. */
function PageTile({ pageNumber, position, previewReady, renderPage, disabled, onToggle }: PageTileProps) {
  const tileRef = useRef<HTMLButtonElement>(null);
  const [preview, setPreview] = useState<PdfPagePreview | null>(null);
  const [failed, setFailed] = useState(false);
  const selected = position > 0;

  useEffect(() => {
    const el = tileRef.current;
    if (!el || !previewReady || preview || failed) return;
    let cancelled = false;

    const load = () => {
      void renderPage(pageNumber).then((res) => {
        if (cancelled) return;
        if (res) setPreview(res);
        else setFailed(true);
      });
    };

    if (typeof IntersectionObserver === "undefined") {
      load();
      return () => {
        cancelled = true;
      };
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          load();
        }
      },
      { rootMargin: "500px 0px" },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, [previewReady, preview, failed, pageNumber, renderPage]);

  return (
    <button
      ref={tileRef}
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      aria-label={selected ? `Page ${pageNumber}, selected as number ${position}` : `Page ${pageNumber}`}
      onClick={(e) => onToggle(pageNumber, e.shiftKey)}
      data-selected={selected}
      className="split-tile group relative text-left"
    >
      <span
        className="split-tile__paper relative block w-full overflow-hidden"
        style={{ aspectRatio: preview ? String(preview.aspect) : "0.707" }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview.dataUrl}
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full object-contain"
          />
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-[var(--theme-text-muted)]">
            {failed || !previewReady ? (
              <FileText className="w-6 h-6" aria-hidden="true" />
            ) : (
              <span className="split-tile__spinner" aria-hidden="true" />
            )}
            <span className="font-mono text-[10px]">{failed ? "No preview" : ""}</span>
          </span>
        )}

        {selected && <span className="absolute inset-0 split-tile__tint" aria-hidden="true" />}
      </span>

      <span className="mt-2 flex items-center justify-between text-xs font-semibold">
        <span>Page {pageNumber}</span>
        <span className="tool-hint">{selected ? "Selected" : "Click to add"}</span>
      </span>

      {/* Order badge — top-right corner, number = position in the exported PDF */}
      <span
        aria-hidden="true"
        className="split-badge"
        data-on={selected}
      >
        {selected ? position : <Check className="w-3.5 h-3.5" strokeWidth={3} />}
      </span>
    </button>
  );
}

export function SplitPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  /** Selected pages in the order the user clicked them = output order. */
  const [order, setOrder] = useState<number[]>([]);
  const [separate, setSeparate] = useState(false);
  const [quickExpr, setQuickExpr] = useState("");
  const [quickError, setQuickError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<{
    blob: Blob;
    isZip: boolean;
    outputCount: number;
    filename: string;
  } | null>(null);
  const lastClicked = useRef<number | null>(null);

  const preview = usePdfPreview(buffer);

  useToolStage(result ? 2 : order.length > 0 ? 1 : 0);

  const positionOf = useMemo(() => {
    const map = new Map<number, number>();
    order.forEach((p, i) => map.set(p, i + 1));
    return map;
  }, [order]);

  const handleFile = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setErrorMsg(null);
    setResult(null);
    try {
      const buf = await f.arrayBuffer();
      const { pageCount } = await inspectPdfBytes(buf);
      setFile(f);
      setBuffer(buf);
      setTotalPages(pageCount);
      setOrder([]);
      setQuickExpr("");
      setQuickError(null);
      lastClicked.current = null;
    } catch (err) {
      setFile(null);
      setBuffer(null);
      setTotalPages(0);
      setOrder([]);
      setErrorMsg(err instanceof Error ? err.message : "Could not read PDF.");
    }
  };

  const changeSelection = (next: number[]) => {
    setResult(null);
    setErrorMsg(null);
    setOrder(next);
  };

  const togglePage = (pageNumber: number, shiftKey: boolean) => {
    const already = positionOf.has(pageNumber);

    // Shift+click: add the whole run between the last clicked page and this one (in page order).
    if (shiftKey && lastClicked.current !== null && !already) {
      const a = Math.min(lastClicked.current, pageNumber);
      const b = Math.max(lastClicked.current, pageNumber);
      const run: number[] = [];
      for (let p = a; p <= b; p++) {
        if (!positionOf.has(p)) run.push(p);
      }
      if (pageNumber < lastClicked.current) run.reverse();
      changeSelection([...order, ...run]);
      lastClicked.current = pageNumber;
      return;
    }

    lastClicked.current = pageNumber;
    changeSelection(already ? order.filter((p) => p !== pageNumber) : [...order, pageNumber]);
  };

  const selectAll = () => {
    lastClicked.current = null;
    changeSelection(Array.from({ length: totalPages }, (_, i) => i + 1));
  };

  const clearSelection = () => {
    lastClicked.current = null;
    changeSelection([]);
  };

  const applyQuickSelect = () => {
    const parsed = parsePageRangeExpression(quickExpr, totalPages);
    if (!parsed.valid) {
      setQuickError(parsed.error ?? "Invalid page range.");
      return;
    }
    setQuickError(null);
    const next: number[] = [];
    parsed.groups.forEach((g) =>
      g.pages.forEach((p) => {
        if (!next.includes(p)) next.push(p);
      }),
    );
    lastClicked.current = null;
    changeSelection(next);
  };

  const handleSplit = async () => {
    if (!file || !buffer || order.length === 0) return;
    setProcessing(true);
    setErrorMsg(null);
    setResult(null);
    trackToolEvent("tool_start", { tool_id: "split-pdf" });

    try {
      const res = await runPdfWorker<{
        blob: Blob;
        isZip: boolean;
        outputCount: number;
        filename: string;
      }>({
        action: "extract",
        buffer: buffer.slice(0),
        baseFilename: file.name,
        pages: order,
        separate,
      });
      setResult(res);
      trackToolEvent("tool_success", { tool_id: "split-pdf" });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Split PDF failed.");
    } finally {
      setProcessing(false);
    }
  };

  const summary =
    order.length === 0
      ? "Click pages below to select them. Numbers show the order they will appear in."
      : separate && order.length > 1
        ? `${order.length} pages selected → ${order.length} separate PDFs in a ZIP.`
        : `${order.length} ${order.length === 1 ? "page" : "pages"} selected → 1 PDF in this order: ${order.join(" → ")}`;

  return (
    <div className="space-y-6">
      <StatusAnnouncer
        message={
          result
            ? `Created ${result.outputCount} output file(s).`
            : order.length > 0
              ? `${order.length} pages selected.`
              : ""
        }
      />

      <FileDropzone
        acceptAttr="application/pdf"
        allowedKinds={["pdf"]}
        maxFileBytes={50 * 1024 * 1024}
        multiple={false}
        label="Drop an unencrypted PDF file to split"
        helperText="Max 50 MB. Every page is previewed here — click the pages you want to keep."
        onFilesAccepted={(files) => void handleFile(files)}
        disabled={processing}
        count={file ? 1 : 0}
      />

      {file && (
        <div className="tool-panel space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold">
              {file.name} — <span className="font-mono">{totalPages} pages</span> ({formatBytes(file.size)})
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={selectAll}
                disabled={processing || order.length === totalPages}
                className="tool-btn tool-btn--ghost tool-btn--sm"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={clearSelection}
                disabled={processing || order.length === 0}
                className="tool-btn tool-btn--danger-ghost tool-btn--sm"
              >
                Clear selection
              </button>
            </div>
          </div>

          {/* Quick select by typing */}
          <div>
            <label htmlFor="split-quick" className="tool-label">
              Quick select (optional) — e.g. 1-3, 5, 8-10
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                id="split-quick"
                type="text"
                value={quickExpr}
                onChange={(e) => {
                  setQuickExpr(e.target.value);
                  setQuickError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyQuickSelect();
                  }
                }}
                placeholder="Type pages, then press Apply"
                className="w-full max-w-md tool-input tool-input--mono"
              />
              <button
                type="button"
                onClick={applyQuickSelect}
                disabled={processing || quickExpr.trim() === ""}
                className="tool-btn tool-btn--ink tool-btn--sm"
              >
                Apply
              </button>
            </div>
            {quickError && (
              <p role="alert" className="mt-1.5 text-xs font-medium text-[var(--status-finding-fg)]">
                {quickError}
              </p>
            )}
          </div>

          {preview.status === "error" && (
            <p className="text-xs text-[var(--status-estimated-fg)]">
              Page previews could not be drawn for this PDF, but you can still select pages by number.
            </p>
          )}

          {/* Page grid */}
          <ul
            aria-label="PDF pages — select the ones to keep"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5 pt-1"
          >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <li key={`${file.name}-${file.size}-${n}`}>
                <PageTile
                  pageNumber={n}
                  position={positionOf.get(n) ?? 0}
                  previewReady={preview.status === "ready"}
                  renderPage={preview.renderPage}
                  disabled={processing}
                  onToggle={togglePage}
                />
              </li>
            ))}
          </ul>

          <p className="tool-hint">
            Tip: hold <kbd className="tool-kbd">Shift</kbd> and click to add a whole run of pages. Click a
            selected page again to remove it — the remaining numbers close up automatically.
          </p>

          <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={separate}
              onChange={(e) => {
                setSeparate(e.target.checked);
                setResult(null);
              }}
              className="accent-[var(--swatch-accent)]"
            />
            <span>Save each selected page as its own PDF (ZIP) instead of one combined PDF</span>
          </label>

          {/* Sticky action bar */}
          <div className="split-actions">
            <p className="text-xs sm:text-sm font-semibold min-w-0 flex-1" aria-live="polite">
              {summary}
            </p>
            <button
              type="button"
              disabled={processing || order.length === 0}
              onClick={() => void handleSplit()}
              className="tool-btn"
            >
              {processing ? (
                <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Scissors className="w-4 h-4" aria-hidden="true" />
              )}
              <span>{processing ? "Splitting..." : "Split PDF"}</span>
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

      <ResultAnchor active={Boolean(result)} label="Split result">
        {result && (
          <div className="tool-result flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-bold text-sm">
                Ready: {result.filename} ({result.outputCount}{" "}
                {result.outputCount === 1 ? "PDF" : "PDFs in ZIP"})
              </p>
              <p className="text-xs font-mono mt-0.5">{formatBytes(result.blob.size)}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerBlobDownload(result.blob, result.filename);
                trackToolEvent("download", {
                  tool_id: "split-pdf",
                  output_format: result.isZip ? "zip" : "pdf",
                });
              }}
              className="tool-btn"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>Download {result.isZip ? "ZIP" : "PDF"}</span>
            </button>
          </div>
        )}
      </ResultAnchor>
    </div>
  );
}
