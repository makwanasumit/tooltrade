"use client";

import React, { useEffect, useRef, useState } from "react";
import JSZip from "jszip";
import { Download, RefreshCw, AlertTriangle, Trash2 } from "lucide-react";
import { FileDropzone } from "@/components/tools/workspace/FileDropzone";
import { BeforeAfterViewer } from "@/components/tools/workspace/BeforeAfterViewer";
import { StatusAnnouncer } from "@/components/tools/workspace/StatusAnnouncer";
import { FileQueue } from "@/components/tools/workspace/FileQueue";
import { ProgressBar, ResultAnchor, useToolStage } from "@/components/tools/workspace/ToolFlow";
import { runImageTask } from "./runImageWorker";
import {
  buildOutputFilename,
  formatBytes,
  triggerBlobDownload,
} from "@/lib/file-processing/filenames";
import { trackToolEvent } from "@/lib/analytics/tracker";

interface CompressedEntry {
  id: string;
  file: File;
  originalUrl: string;
  outputUrl: string;
  outputBlob: Blob;
  originalDims: string;
  outputDims: string;
  outputMime: string;
}

export function ImageCompressorTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [outputFormat, setOutputFormat] = useState<"keep" | "image/webp" | "image/jpeg" | "image/png">("keep");
  const [quality, setQuality] = useState(78);
  const [maxWidth, setMaxWidth] = useState<string>("");
  const [stripMetadata, setStripMetadata] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<CompressedEntry[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [ranWith, setRanWith] = useState<string | null>(null);
  const urlsRef = useRef<string[]>([]);

  useToolStage(results.length > 0 ? 2 : files.length > 0 ? 1 : 0);

  // Changing settings after a run means the shown output no longer matches the controls.
  const settingsKey = `${outputFormat}|${quality}|${maxWidth}`;
  const stale = ranWith !== null && ranWith !== settingsKey;

  const revokeAll = () => {
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current = [];
  };

  useEffect(() => () => revokeAll(), []);

  const hasLossyTarget =
    outputFormat === "image/jpeg" ||
    outputFormat === "image/webp" ||
    (outputFormat === "keep" && files.some((f) => f.type === "image/jpeg" || f.type === "image/webp"));

  const handleFilesAccepted = (accepted: File[]) => {
    revokeAll();
    setResults([]);
    setErrorMsg(null);
    setFiles(accepted);
    setStatusMsg(`${accepted.length} image(s) selected.`);
  };

  const handleCompress = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setErrorMsg(null);
    setProgress({ done: 0, total: files.length });
    revokeAll();
    setResults([]);
    trackToolEvent("tool_start", { tool_id: "image-compressor" });

    try {
      const parsedMaxW = maxWidth.trim() ? Math.max(16, Math.min(8000, Number(maxWidth))) : undefined;
      const out: CompressedEntry[] = [];

      for (const file of files) {
        const targetFormat: "image/jpeg" | "image/png" | "image/webp" =
          outputFormat === "keep"
            ? file.type === "image/png"
              ? "image/png"
              : file.type === "image/webp"
                ? "image/webp"
                : "image/jpeg"
            : outputFormat;

        let width: number | undefined;
        let height: number | undefined;

        if (parsedMaxW && Number.isFinite(parsedMaxW)) {
          const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
          if (bmp.width > parsedMaxW) {
            const ratio = parsedMaxW / bmp.width;
            width = parsedMaxW;
            height = Math.max(1, Math.round(bmp.height * ratio));
          }
          bmp.close();
        }

        const res = await runImageTask(file, {
          targetFormat,
          quality: quality / 100,
          width,
          height,
        });

        const origUrl = URL.createObjectURL(file);
        const outUrl = URL.createObjectURL(res.blob);
        urlsRef.current.push(origUrl, outUrl);

        out.push({
          id: `${file.name}-${file.size}-${Math.random()}`,
          file,
          originalUrl: origUrl,
          outputUrl: outUrl,
          outputBlob: res.blob,
          originalDims: `${res.originalWidth}×${res.originalHeight}`,
          outputDims: `${res.width}×${res.height}`,
          outputMime: res.mimeType,
        });
        setProgress({ done: out.length, total: files.length });
      }

      setResults(out);
      setRanWith(settingsKey);
      const saved = files.reduce((s, f) => s + f.size, 0) - out.reduce((s, r) => s + r.outputBlob.size, 0);
      setStatusMsg(`Compressed ${out.length} image(s). ${saved > 0 ? `Saved ${formatBytes(saved)}.` : "No size reduction."}`);
      trackToolEvent("tool_success", { tool_id: "image-compressor" });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Compression failed.");
      trackToolEvent("tool_error", { tool_id: "image-compressor", error_code: "encode_failed" });
    } finally {
      setProcessing(false);
    }
  };

  const downloadZip = async () => {
    const zip = new JSZip();
    results.forEach((r) => {
      const ext = r.outputMime.replace("image/", "").replace("jpeg", "jpg");
      zip.file(buildOutputFilename(r.file.name, "-compressed", ext), r.outputBlob);
    });
    const zipBlob = await zip.generateAsync({ type: "blob" });
    triggerBlobDownload(zipBlob, "compressed-images.zip");
    trackToolEvent("download", { tool_id: "image-compressor", output_format: "zip" });
  };

  const removeFile = (index: number) => {
    revokeAll();
    setResults([]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const totalBefore = files.reduce((s, f) => s + f.size, 0);
  const totalAfter = results.reduce((s, r) => s + r.outputBlob.size, 0);
  const savedPct = totalBefore > 0 ? Math.round(((totalBefore - totalAfter) / totalBefore) * 100) : 0;

  const resetAll = () => {
    revokeAll();
    setFiles([]);
    setResults([]);
    setErrorMsg(null);
    setStatusMsg("Image compressor reset.");
  };

  return (
    <div className="space-y-6">
      <StatusAnnouncer message={statusMsg} />

      <FileDropzone
        acceptAttr="image/jpeg,image/png,image/webp"
        allowedKinds={["jpeg", "png", "webp"]}
        maxFileBytes={25 * 1024 * 1024}
        maxFiles={15}
        multiple
        label="Drop JPEG, PNG, or WebP images here"
        helperText="Up to 15 images, max 25 MB each. Processed locally in a Web Worker."
        onFilesAccepted={handleFilesAccepted}
        disabled={processing}
        count={files.length}
      />

      {files.length > 0 && (
        <div className="tool-panel space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold">
              {files.length} {files.length === 1 ? "image" : "images"} · {formatBytes(totalBefore)}
            </p>
            <button
              type="button"
              onClick={resetAll}
              className="tool-btn tool-btn--danger-ghost tool-btn--sm"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset</span>
            </button>
          </div>

          <FileQueue files={files} onRemove={removeFile} disabled={processing} />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="comp-format" className="tool-label">
                Output format
              </label>
              <select
                id="comp-format"
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value as typeof outputFormat)}
                className="w-full tool-input"
              >
                <option value="keep">Keep original format</option>
                <option value="image/webp">WebP (smallest web size)</option>
                <option value="image/jpeg">JPEG (photos)</option>
                <option value="image/png">PNG (lossless)</option>
              </select>
            </div>

            <div>
              <label htmlFor="comp-maxw" className="tool-label">
                Optional max width (px)
              </label>
              <input
                id="comp-maxw"
                type="number"
                min={16}
                max={8000}
                placeholder="Original width"
                value={maxWidth}
                onChange={(e) => setMaxWidth(e.target.value)}
                className="w-full tool-input"
              />
            </div>

            {hasLossyTarget ? (
              <div>
                <label htmlFor="comp-quality" className="tool-label">
                  Lossy quality ({quality}%)
                </label>
                <input
                  id="comp-quality"
                  type="range"
                  min={15}
                  max={95}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="tool-range"
                />
              </div>
            ) : (
              <div className="flex items-center text-xs text-[var(--theme-text-muted)]">
                PNG export is lossless; switch to WebP or JPEG to adjust lossy quality.
              </div>
            )}
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={stripMetadata}
              onChange={(e) => setStripMetadata(e.target.checked)}
              className="accent-[var(--swatch-accent)]"
            />
            <span>
              Remove EXIF/GPS metadata on export (recommended; browser canvas re-encode omits EXIF)
            </span>
          </label>

          {processing && <ProgressBar done={progress.done} total={progress.total} label="Compressing" />}

          <div className="tool-actions">
            <button
              type="button"
              disabled={processing}
              onClick={() => void handleCompress()}
              className="tool-btn"
            >
              <RefreshCw className={`w-4 h-4 ${processing ? "animate-spin" : ""}`} aria-hidden="true" />
              <span>{processing ? "Compressing…" : results.length ? "Compress again" : "Compress images"}</span>
            </button>
            {stale && results.length > 0 && !processing && (
              <span className="tool-hint">Settings changed — compress again to apply.</span>
            )}
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

      <ResultAnchor active={results.length > 0} label="Compressed results">
        <div className="space-y-6">
          <div className="tool-result flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow-m mb-2">Compressed results ({results.length})</p>
              <h2 className="heading-s">
                {savedPct > 0 ? `${savedPct}% smaller` : "Done"}
              </h2>
              <p className="text-xs font-mono mt-1">
                {formatBytes(totalBefore)} → {formatBytes(totalAfter)} · {results.length}{" "}
                {results.length === 1 ? "image" : "images"}
              </p>
            </div>
            {results.length > 1 && (
              <button
                type="button"
                onClick={() => void downloadZip()}
                className="tool-btn tool-btn--coral"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>Download All (.zip)</span>
              </button>
            )}
          </div>

          {results.map((item) => {
            const grew = item.outputBlob.size >= item.file.size;
            const ext = item.outputMime.replace("image/", "").replace("jpeg", "jpg");
            return (
              <div
                key={item.id}
                className="tool-card space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-sm">{item.file.name}</p>
                  <button
                    type="button"
                    onClick={() => {
                      triggerBlobDownload(
                        item.outputBlob,
                        buildOutputFilename(item.file.name, "-compressed", ext),
                      );
                      trackToolEvent("download", { tool_id: "image-compressor", output_format: ext });
                    }}
                    className="tool-btn tool-btn--sm"
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Download {ext.toUpperCase()}</span>
                  </button>
                </div>

                {grew && (
                  <div
                    className="rounded-xl px-3.5 py-2.5 text-xs border flex items-center gap-2"
                    style={{
                      color: "var(--status-estimated-fg)",
                      backgroundColor: "var(--status-estimated-bg)",
                      borderColor: "var(--status-estimated-border)",
                    }}
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>
                      Compressed file is larger than original (often happens when converting JPEG to
                      lossless PNG). Consider keeping the original or choosing WebP.
                    </span>
                  </div>
                )}

                <BeforeAfterViewer
                  originalUrl={item.originalUrl}
                  outputUrl={item.outputUrl}
                  originalBytes={item.file.size}
                  outputBytes={item.outputBlob.size}
                  originalDimensions={item.originalDims}
                  outputDimensions={item.outputDims}
                  outputMime={item.outputMime}
                  altName={item.file.name}
                />
              </div>
            );
          })}
        </div>
      </ResultAnchor>
    </div>
  );
}

