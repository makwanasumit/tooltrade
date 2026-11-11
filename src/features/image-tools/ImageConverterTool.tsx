"use client";

import React, { useEffect, useRef, useState } from "react";
import JSZip from "jszip";
import { Download, RefreshCw, Trash2 } from "lucide-react";
import { FileDropzone } from "@/components/tools/workspace/FileDropzone";
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

interface ConvertedItem {
  id: string;
  file: File;
  blob: Blob;
  previewUrl: string;
  dims: string;
}

export function ImageConverterTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState<"image/png" | "image/jpeg" | "image/webp">("image/webp");
  const [quality, setQuality] = useState(85);
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<ConvertedItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const urlsRef = useRef<string[]>([]);

  useToolStage(results.length > 0 ? 2 : files.length > 0 ? 1 : 0);

  const revokeAll = () => {
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current = [];
  };

  useEffect(() => () => revokeAll(), []);

  const handleConvert = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setErrorMsg(null);
    setProgress({ done: 0, total: files.length });
    revokeAll();
    setResults([]);
    trackToolEvent("tool_start", { tool_id: "image-converter" });

    try {
      const out: ConvertedItem[] = [];
      for (const file of files) {
        const res = await runImageTask(file, {
          targetFormat,
          quality: quality / 100,
          backgroundColor: targetFormat === "image/jpeg" ? bgColor : undefined,
        });
        const url = URL.createObjectURL(res.blob);
        urlsRef.current.push(url);
        out.push({
          id: `${file.name}-${Math.random()}`,
          file,
          blob: res.blob,
          previewUrl: url,
          dims: `${res.width}×${res.height}`,
        });
        setProgress({ done: out.length, total: files.length });
      }
      setResults(out);
      trackToolEvent("tool_success", { tool_id: "image-converter" });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Conversion failed.");
      trackToolEvent("tool_error", { tool_id: "image-converter", error_code: "convert_failed" });
    } finally {
      setProcessing(false);
    }
  };

  const ext = targetFormat.replace("image/", "").replace("jpeg", "jpg");

  const downloadZip = async () => {
    const zip = new JSZip();
    results.forEach((r) => {
      zip.file(buildOutputFilename(r.file.name, "-converted", ext), r.blob);
    });
    const zipBlob = await zip.generateAsync({ type: "blob" });
    triggerBlobDownload(zipBlob, `converted-${ext}.zip`);
    trackToolEvent("download", { tool_id: "image-converter", output_format: "zip" });
  };

  return (
    <div className="space-y-6">
      <StatusAnnouncer message={results.length ? `Converted ${results.length} file(s).` : ""} />

      <FileDropzone
        acceptAttr="image/jpeg,image/png,image/webp"
        allowedKinds={["jpeg", "png", "webp"]}
        maxFileBytes={25 * 1024 * 1024}
        maxFiles={15}
        multiple
        label="Drop JPEG, PNG, or WebP images to convert"
        helperText="Up to 15 images, max 25 MB each. Respects EXIF orientation."
        onFilesAccepted={(accepted) => {
          revokeAll();
          setResults([]);
          setErrorMsg(null);
          setFiles(accepted);
        }}
        disabled={processing}
        count={files.length}
      />

      {files.length > 0 && (
        <div className="tool-panel space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold">{files.length} {files.length === 1 ? "image" : "images"} queued</p>
            <button
              type="button"
              onClick={() => {
                revokeAll();
                setFiles([]);
                setResults([]);
              }}
              className="tool-btn tool-btn--danger-ghost tool-btn--sm"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Clear</span>
            </button>
          </div>

          <FileQueue
            files={files}
            disabled={processing}
            onRemove={(i) => {
              revokeAll();
              setResults([]);
              setFiles((prev) => prev.filter((_, idx) => idx !== i));
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="conv-fmt" className="tool-label">
                Convert to format
              </label>
              <select
                id="conv-fmt"
                value={targetFormat}
                onChange={(e) => setTargetFormat(e.target.value as typeof targetFormat)}
                className="w-full tool-input"
              >
                <option value="image/webp">WebP</option>
                <option value="image/png">PNG (keeps transparency)</option>
                <option value="image/jpeg">JPEG</option>
              </select>
            </div>

            {targetFormat !== "image/png" ? (
              <div>
                <label htmlFor="conv-qual" className="tool-label">
                  Quality ({quality}%)
                </label>
                <input
                  id="conv-qual"
                  type="range"
                  min={20}
                  max={98}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="tool-range"
                />
              </div>
            ) : (
              <div className="flex items-center text-xs text-[var(--theme-text-muted)]">
                PNG output is lossless; alpha transparency is preserved.
              </div>
            )}

            {targetFormat === "image/jpeg" && (
              <div>
                <label htmlFor="conv-bg" className="tool-label">
                  Transparent fill background
                </label>
                <input
                  id="conv-bg"
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="tool-input !h-10 !p-1 cursor-pointer"
                />
              </div>
            )}
          </div>

          {processing && <ProgressBar done={progress.done} total={progress.total} label="Converting" />}

          <button
            type="button"
            disabled={processing}
            onClick={() => void handleConvert()}
            className="tool-btn"
          >
            <RefreshCw className={`w-4 h-4 ${processing ? "animate-spin" : ""}`} aria-hidden="true" />
            <span>{processing ? "Converting..." : `Convert to ${ext.toUpperCase()}`}</span>
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

      <ResultAnchor active={results.length > 0} label="Converted files">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Converted Files ({results.length})</h2>
            {results.length > 1 && (
              <button
                type="button"
                onClick={() => void downloadZip()}
                className="tool-btn tool-btn--coral"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>Download ZIP</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((item) => (
              <div
                key={item.id}
                className="tool-card flex flex-col justify-between gap-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  className="w-full h-36 object-contain rounded-xl bg-[var(--theme-surface-muted)]/40"
                />
                <div className="text-xs space-y-1">
                  <p className="font-semibold truncate">{buildOutputFilename(item.file.name, "", ext)}</p>
                  <p className="font-mono text-[var(--theme-text-muted)]">
                    {item.dims} • {formatBytes(item.blob.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerBlobDownload(item.blob, buildOutputFilename(item.file.name, "-converted", ext));
                    trackToolEvent("download", { tool_id: "image-converter", output_format: ext });
                  }}
                  className="tool-btn tool-btn--sm"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Download</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </ResultAnchor>
    </div>
  );
}

