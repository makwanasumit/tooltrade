"use client";

import React, { useEffect, useRef, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { FileDropzone } from "@/components/tools/workspace/FileDropzone";
import { BeforeAfterViewer } from "@/components/tools/workspace/BeforeAfterViewer";
import { StatusAnnouncer } from "@/components/tools/workspace/StatusAnnouncer";
import { ResultAnchor, useToolStage } from "@/components/tools/workspace/ToolFlow";
import { runImageTask } from "./runImageWorker";
import { buildOutputFilename, triggerBlobDownload } from "@/lib/file-processing/filenames";
import { trackToolEvent } from "@/lib/analytics/tracker";

export function ImageResizerTool() {
  const [file, setFile] = useState<File | null>(null);
  const [origW, setOrigW] = useState(0);
  const [origH, setOrigH] = useState(0);
  const [mode, setMode] = useState<"pixels" | "percent">("pixels");
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [percent, setPercent] = useState(50);
  const [lockAspect, setLockAspect] = useState(true);
  const [containFit, setContainFit] = useState(false);
  const [format, setFormat] = useState<"image/jpeg" | "image/png" | "image/webp">("image/webp");
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [output, setOutput] = useState<{
    origUrl: string;
    outUrl: string;
    blob: Blob;
    dims: string;
  } | null>(null);
  const urlsRef = useRef<string[]>([]);

  useToolStage(output ? 2 : file ? 1 : 0);

  const revokeAll = () => {
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current = [];
  };
  useEffect(() => () => revokeAll(), []);

  const handleSelect = async (accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    revokeAll();
    setOutput(null);
    setErrorMsg(null);
    const bmp = await createImageBitmap(f, { imageOrientation: "from-image" });
    setOrigW(bmp.width);
    setOrigH(bmp.height);
    setWidth(bmp.width);
    setHeight(bmp.height);
    bmp.close();
    setFile(f);
    if (f.type === "image/png") setFormat("image/png");
    else if (f.type === "image/jpeg") setFormat("image/jpeg");
    else setFormat("image/webp");
  };

  const handleWidthChange = (nextW: number) => {
    setWidth(nextW);
    if (lockAspect && origW > 0 && origH > 0 && nextW > 0) {
      setHeight(Math.max(1, Math.round((nextW / origW) * origH)));
    }
  };

  const handleHeightChange = (nextH: number) => {
    setHeight(nextH);
    if (lockAspect && origW > 0 && origH > 0 && nextH > 0) {
      setWidth(Math.max(1, Math.round((nextH / origH) * origW)));
    }
  };

  const targetW = mode === "percent" ? Math.max(1, Math.round((origW * percent) / 100)) : width;
  const targetH = mode === "percent" ? Math.max(1, Math.round((origH * percent) / 100)) : height;

  const handleResize = async () => {
    if (!file) return;
    if (targetW < 1 || targetH < 1 || targetW > 8000 || targetH > 8000) {
      setErrorMsg("Dimensions must be between 1 and 8000 px.");
      return;
    }
    setProcessing(true);
    setErrorMsg(null);
    revokeAll();
    setOutput(null);
    trackToolEvent("tool_start", { tool_id: "image-resizer" });

    try {
      const res = await runImageTask(file, {
        targetFormat: format,
        quality: 0.9,
        width: targetW,
        height: targetH,
        fitMode: !lockAspect && containFit ? "contain" : "stretch",
        backgroundColor: "#ffffff",
      });
      const origUrl = URL.createObjectURL(file);
      const outUrl = URL.createObjectURL(res.blob);
      urlsRef.current.push(origUrl, outUrl);
      setOutput({ origUrl, outUrl, blob: res.blob, dims: `${res.width}×${res.height}` });
      trackToolEvent("tool_success", { tool_id: "image-resizer" });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Resize failed.");
    } finally {
      setProcessing(false);
    }
  };

  const ext = format.replace("image/", "").replace("jpeg", "jpg");

  return (
    <div className="space-y-6">
      <StatusAnnouncer message={output ? `Image resized to ${output.dims}.` : ""} />

      <FileDropzone
        acceptAttr="image/jpeg,image/png,image/webp"
        allowedKinds={["jpeg", "png", "webp"]}
        maxFileBytes={25 * 1024 * 1024}
        multiple={false}
        label="Drop a JPEG, PNG, or WebP image to resize"
        helperText="Max 25 MB, output dimensions up to 8000 × 8000 px."
        onFilesAccepted={(files) => void handleSelect(files)}
        disabled={processing}
        count={file ? 1 : 0}
      />

      {file && (
        <div className="tool-panel space-y-4">
          <p className="text-sm font-semibold">
            {file.name} — Original: <span className="font-mono">{origW}×{origH} px</span>
          </p>

          <div className="flex gap-2">
            {(["pixels", "percent"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
                  mode === m
                    ? "bg-[var(--swatch-accent)] text-white"
                    : "bg-[var(--theme-surface)] border border-[var(--theme-border)]"
                }`}
              >
                {m === "pixels" ? "By Pixels" : "By Percentage"}
              </button>
            ))}
          </div>

          {mode === "pixels" ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="res-w" className="tool-label">
                  Width (px)
                </label>
                <input
                  id="res-w"
                  type="number"
                  min={1}
                  max={8000}
                  value={width}
                  onChange={(e) => handleWidthChange(Number(e.target.value))}
                  className="w-full tool-input tool-input--mono"
                />
              </div>
              <div>
                <label htmlFor="res-h" className="tool-label">
                  Height (px)
                </label>
                <input
                  id="res-h"
                  type="number"
                  min={1}
                  max={8000}
                  value={height}
                  onChange={(e) => handleHeightChange(Number(e.target.value))}
                  className="w-full tool-input tool-input--mono"
                />
              </div>
              <div>
                <label htmlFor="res-fmt" className="tool-label">
                  Output format
                </label>
                <select
                  id="res-fmt"
                  value={format}
                  onChange={(e) => setFormat(e.target.value as typeof format)}
                  className="w-full tool-input"
                >
                  <option value="image/webp">WebP</option>
                  <option value="image/jpeg">JPEG</option>
                  <option value="image/png">PNG</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="res-pct" className="tool-label">
                  Scale ({percent}% → {targetW}×{targetH} px)
                </label>
                <input
                  id="res-pct"
                  type="range"
                  min={10}
                  max={200}
                  value={percent}
                  onChange={(e) => setPercent(Number(e.target.value))}
                  className="tool-range"
                />
              </div>
              <div>
                <label htmlFor="res-fmt-2" className="tool-label">
                  Output format
                </label>
                <select
                  id="res-fmt-2"
                  value={format}
                  onChange={(e) => setFormat(e.target.value as typeof format)}
                  className="w-full tool-input"
                >
                  <option value="image/webp">WebP</option>
                  <option value="image/jpeg">JPEG</option>
                  <option value="image/png">PNG</option>
                </select>
              </div>
            </div>
          )}

          {mode === "pixels" && (
            <div className="flex flex-wrap gap-5 text-xs font-medium">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lockAspect}
                  onChange={(e) => setLockAspect(e.target.checked)}
                  className="accent-[var(--swatch-accent)]"
                />
                <span>Lock aspect ratio</span>
              </label>

              {!lockAspect && (
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={containFit}
                    onChange={(e) => setContainFit(e.target.checked)}
                    className="accent-[var(--swatch-accent)]"
                  />
                  <span>Contain fit (pad inside target box instead of stretching)</span>
                </label>
              )}
            </div>
          )}

          <button
            type="button"
            disabled={processing}
            onClick={() => void handleResize()}
            className="tool-btn"
          >
            <RefreshCw className={`w-4 h-4 ${processing ? "animate-spin" : ""}`} aria-hidden="true" />
            <span>{processing ? "Resizing..." : "Resize Image"}</span>
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

      <ResultAnchor active={Boolean(output && file)} label="Resized image">
        {output && file && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Resized Output ({output.dims})</h2>
            <button
              type="button"
              onClick={() => {
                triggerBlobDownload(output.blob, buildOutputFilename(file.name, "-resized", ext));
                trackToolEvent("download", { tool_id: "image-resizer", output_format: ext });
              }}
              className="tool-btn"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>Download {ext.toUpperCase()}</span>
            </button>
          </div>

          <BeforeAfterViewer
            originalUrl={output.origUrl}
            outputUrl={output.outUrl}
            originalBytes={file.size}
            outputBytes={output.blob.size}
            originalDimensions={`${origW}×${origH}`}
            outputDimensions={output.dims}
            outputMime={format}
            altName={file.name}
          />
        </div>
        )}
      </ResultAnchor>
    </div>
  );
}

