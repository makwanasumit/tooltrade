"use client";

import React, { useState } from "react";
import { ArrowUp, ArrowDown, Trash2, Download, FileImage, RefreshCw } from "lucide-react";
import { FileDropzone } from "@/components/tools/workspace/FileDropzone";
import { StatusAnnouncer } from "@/components/tools/workspace/StatusAnnouncer";
import { ResultAnchor, useToolStage } from "@/components/tools/workspace/ToolFlow";
import { runPdfWorker, type ImagePdfItem } from "./runPdfWorker";
import { formatBytes, triggerBlobDownload } from "@/lib/file-processing/filenames";
import { trackToolEvent } from "@/lib/analytics/tracker";

interface ImageQueueRow {
  id: string;
  file: File;
}

async function normalizeImageForPdf(file: File): Promise<ImagePdfItem> {
  // Decode with EXIF orientation applied so rotated phone photos embed upright
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const canvas = document.createElement("canvas");
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable.");
  ctx.drawImage(bmp, 0, 0);
  bmp.close();

  const targetMime: "image/jpeg" | "image/png" =
    file.type === "image/png" ? "image/png" : "image/jpeg";

  const normalizedBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Image normalization failed."))),
      targetMime,
      targetMime === "image/jpeg" ? 0.92 : undefined,
    );
  });

  return {
    buffer: await normalizedBlob.arrayBuffer(),
    mimeType: targetMime,
  };
}

export function JpgToPdfTool() {
  const [rows, setRows] = useState<ImageQueueRow[]>([]);
  const [pageSize, setPageSize] = useState<"a4" | "letter" | "fit">("a4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [marginPt, setMarginPt] = useState(24);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pdfResult, setPdfResult] = useState<{ blob: Blob; pageCount: number } | null>(null);

  useToolStage(pdfResult ? 2 : rows.length > 0 ? 1 : 0);

  const moveRow = (idx: number, delta: -1 | 1) => {
    const nextIdx = idx + delta;
    if (nextIdx < 0 || nextIdx >= rows.length) return;
    setPdfResult(null);
    setRows((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      if (item) copy.splice(nextIdx, 0, item);
      return copy;
    });
  };

  const handleBuild = async () => {
    if (rows.length === 0) return;
    setProcessing(true);
    setErrorMsg(null);
    setPdfResult(null);
    trackToolEvent("tool_start", { tool_id: "jpg-to-pdf" });

    try {
      const prepared = await Promise.all(rows.map((r) => normalizeImageForPdf(r.file)));
      const res = await runPdfWorker<{ blob: Blob; pageCount: number }>({
        action: "images-to-pdf",
        images: prepared,
        options: { pageSize, orientation, marginPt },
      });
      setPdfResult(res);
      trackToolEvent("tool_success", { tool_id: "jpg-to-pdf" });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to build PDF from images.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <StatusAnnouncer message={pdfResult ? `Built ${pdfResult.pageCount}-page PDF.` : ""} />

      <FileDropzone
        acceptAttr="image/jpeg,image/png"
        allowedKinds={["jpeg", "png"]}
        maxFileBytes={25 * 1024 * 1024}
        maxFiles={30}
        multiple
        label="Drop JPEG or PNG images to assemble into a PDF"
        helperText="Up to 30 images. Respects smartphone EXIF orientation automatically."
        onFilesAccepted={(accepted) => {
          setPdfResult(null);
          setErrorMsg(null);
          setRows((prev) => [
            ...prev,
            ...accepted.map((file) => ({ id: `${file.name}-${Math.random()}`, file })),
          ]);
        }}
        disabled={processing}
        mode="add"
        count={rows.length}
      />

      {rows.length > 0 && (
        <div className="tool-panel space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{rows.length} image(s) queued</p>
            <button
              type="button"
              onClick={() => {
                setRows([]);
                setPdfResult(null);
              }}
              className="text-xs font-semibold text-[var(--status-finding-fg)] cursor-pointer"
            >
              Clear
            </button>
          </div>

          <ul className="space-y-2" aria-label="Image page order">
            {rows.map((row, idx) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border-[1.5px] border-[var(--swatch-ink)] bg-[var(--theme-surface)] px-4 py-2.5 text-sm"
              >
                <span className="truncate font-medium">
                  Page {idx + 1}: {row.file.name}{" "}
                  <span className="text-xs text-[var(--theme-text-muted)]">
                    ({formatBytes(row.file.size)})
                  </span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveRow(idx, -1)}
                    aria-label={`Move ${row.file.name} earlier`}
                    className="p-1.5 rounded-lg border border-[var(--theme-border)] disabled:opacity-35 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === rows.length - 1}
                    onClick={() => moveRow(idx, 1)}
                    aria-label={`Move ${row.file.name} later`}
                    className="p-1.5 rounded-lg border border-[var(--theme-border)] disabled:opacity-35 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRows((prev) => prev.filter((r) => r.id !== row.id))}
                    aria-label={`Remove ${row.file.name}`}
                    className="p-1.5 rounded-lg border border-[var(--status-finding-border)] text-[var(--status-finding-fg)] cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="j2p-size" className="tool-label">
                Page size
              </label>
              <select
                id="j2p-size"
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as typeof pageSize)}
                className="w-full tool-input"
              >
                <option value="a4">A4</option>
                <option value="letter">US Letter</option>
                <option value="fit">Fit to each image</option>
              </select>
            </div>

            {pageSize !== "fit" && (
              <div>
                <label htmlFor="j2p-orient" className="tool-label">
                  Orientation
                </label>
                <select
                  id="j2p-orient"
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as typeof orientation)}
                  className="w-full tool-input"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            )}

            <div>
              <label htmlFor="j2p-margin" className="tool-label">
                Margin ({marginPt} pt)
              </label>
              <input
                id="j2p-margin"
                type="range"
                min={0}
                max={64}
                step={8}
                value={marginPt}
                onChange={(e) => setMarginPt(Number(e.target.value))}
                className="tool-range"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={processing}
            onClick={() => void handleBuild()}
            className="tool-btn"
          >
            {processing ? (
              <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <FileImage className="w-4 h-4" aria-hidden="true" />
            )}
            <span>{processing ? "Creating PDF..." : "Create PDF"}</span>
          </button>
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

      <ResultAnchor active={Boolean(pdfResult)} label="PDF result">
        {pdfResult && (
        <div className="tool-result flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-bold text-sm">PDF ready ({pdfResult.pageCount} pages)</p>
            <p className="text-xs font-mono mt-0.5">{formatBytes(pdfResult.blob.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerBlobDownload(pdfResult.blob, "images-to-pdf.pdf");
              trackToolEvent("download", { tool_id: "jpg-to-pdf", output_format: "pdf" });
            }}
            className="tool-btn"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Download PDF</span>
          </button>
        </div>
      )}
      </ResultAnchor>
    </div>
  );
}

