"use client";

import React, { useEffect, useRef, useState } from "react";
import { Download, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { FileDropzone } from "@/components/tools/workspace/FileDropzone";
import { BeforeAfterViewer } from "@/components/tools/workspace/BeforeAfterViewer";
import { StatusAnnouncer } from "@/components/tools/workspace/StatusAnnouncer";
import { ResultAnchor, useToolStage } from "@/components/tools/workspace/ToolFlow";
import { runImageTask } from "./runImageWorker";
import {
  buildOutputFilename,
  formatBytes,
  triggerBlobDownload,
} from "@/lib/file-processing/filenames";
import { trackToolEvent } from "@/lib/analytics/tracker";

export function PhotoSignatureResizerTool() {
  const [file, setFile] = useState<File | null>(null);
  const [origDims, setOrigDims] = useState("0×0");
  const [width, setWidth] = useState(200);
  const [height, setHeight] = useState(230);
  const [targetKb, setTargetKb] = useState(50);
  const [format, setFormat] = useState<"image/jpeg" | "image/png" | "image/webp">("image/jpeg");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<{
    origUrl: string;
    outUrl: string;
    blob: Blob;
    dims: string;
    hitTarget: boolean;
    note?: string;
  } | null>(null);
  const urlsRef = useRef<string[]>([]);

  useToolStage(result ? 2 : file ? 1 : 0);

  const revokeAll = () => {
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current = [];
  };
  useEffect(() => () => revokeAll(), []);

  const handleFile = async (accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    revokeAll();
    setResult(null);
    setErrorMsg(null);
    const bmp = await createImageBitmap(f, { imageOrientation: "from-image" });
    setOrigDims(`${bmp.width}×${bmp.height}`);
    bmp.close();
    setFile(f);
  };

  const handleRun = async () => {
    if (!file) return;
    if (width < 10 || height < 10 || width > 4000 || height > 4000 || targetKb < 2) {
      setErrorMsg("Enter dimensions between 10 and 4000 px and a target of at least 2 KB.");
      return;
    }
    setProcessing(true);
    setErrorMsg(null);
    revokeAll();
    setResult(null);
    trackToolEvent("tool_start", { tool_id: "photo-signature-resizer" });

    try {
      const res = await runImageTask(file, {
        targetFormat: format,
        quality: 0.9,
        width,
        height,
        fitMode: "contain",
        backgroundColor: bgColor,
        targetMaxBytes: targetKb * 1024,
      });

      const origUrl = URL.createObjectURL(file);
      const outUrl = URL.createObjectURL(res.blob);
      urlsRef.current.push(origUrl, outUrl);

      setResult({
        origUrl,
        outUrl,
        blob: res.blob,
        dims: `${res.width}×${res.height}`,
        hitTarget: Boolean(res.hitTargetBytes),
        note: res.note,
      });
      trackToolEvent("tool_success", { tool_id: "photo-signature-resizer" });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Processing failed.");
    } finally {
      setProcessing(false);
    }
  };

  const ext = format.replace("image/", "").replace("jpeg", "jpg");

  return (
    <div className="space-y-6">
      <StatusAnnouncer message={result ? `Processed file size is ${formatBytes(result.blob.size)}.` : ""} />

      <FileDropzone
        acceptAttr="image/jpeg,image/png,image/webp"
        allowedKinds={["jpeg", "png", "webp"]}
        maxFileBytes={20 * 1024 * 1024}
        multiple={false}
        label="Drop your photo or signature scan"
        helperText="Enter custom width, height, and max KB limits directly from your form instructions."
        onFilesAccepted={(files) => void handleFile(files)}
        disabled={processing}
        count={file ? 1 : 0}
      />

      {file && (
        <div className="tool-panel space-y-4">
          <p className="text-sm font-semibold">
            {file.name} (Original: <span className="font-mono">{origDims}</span>,{" "}
            {formatBytes(file.size)})
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label htmlFor="ps-w" className="tool-label">
                Target width (px)
              </label>
              <input
                id="ps-w"
                type="number"
                min={10}
                max={4000}
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full tool-input tool-input--mono"
              />
            </div>

            <div>
              <label htmlFor="ps-h" className="tool-label">
                Target height (px)
              </label>
              <input
                id="ps-h"
                type="number"
                min={10}
                max={4000}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full tool-input tool-input--mono"
              />
            </div>

            <div>
              <label htmlFor="ps-kb" className="tool-label">
                Max file size (KB)
              </label>
              <input
                id="ps-kb"
                type="number"
                min={2}
                max={10000}
                value={targetKb}
                onChange={(e) => setTargetKb(Number(e.target.value))}
                className="w-full tool-input tool-input--mono"
              />
            </div>

            <div>
              <label htmlFor="ps-fmt" className="tool-label">
                Output format
              </label>
              <select
                id="ps-fmt"
                value={format}
                onChange={(e) => setFormat(e.target.value as typeof format)}
                className="w-full tool-input"
              >
                <option value="image/jpeg">JPEG (best for KB targets)</option>
                <option value="image/webp">WebP</option>
                <option value="image/png">PNG</option>
              </select>
            </div>

            <div>
              <label htmlFor="ps-bg" className="tool-label">
                Pad fill color
              </label>
              <input
                id="ps-bg"
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="tool-input !h-10 !p-1 cursor-pointer"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={processing}
            onClick={() => void handleRun()}
            className="tool-btn"
          >
            <RefreshCw className={`w-4 h-4 ${processing ? "animate-spin" : ""}`} aria-hidden="true" />
            <span>{processing ? "Targeting size..." : "Resize to Target KB"}</span>
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

      <ResultAnchor active={Boolean(result && file)} label="Resized photo">
        {result && file && (
        <div className="space-y-4">
          <div
            className="rounded-xl px-4 py-3 text-sm border flex flex-wrap items-center justify-between gap-3"
            style={
              result.hitTarget
                ? {
                    color: "var(--status-verified-fg)",
                    backgroundColor: "var(--status-verified-bg)",
                    borderColor: "var(--status-verified-border)",
                  }
                : {
                    color: "var(--status-estimated-fg)",
                    backgroundColor: "var(--status-estimated-bg)",
                    borderColor: "var(--status-estimated-border)",
                  }
            }
          >
            <div className="flex items-start gap-2">
              {result.hitTarget ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              )}
              <div>
                <p className="font-semibold">
                  {result.hitTarget
                    ? `Matched your entered limits: ${result.dims} px at ${formatBytes(result.blob.size)} (under ${targetKb} KB).`
                    : `Closest output: ${result.dims} px at ${formatBytes(result.blob.size)} (exceeds ${targetKb} KB target).`}
                </p>
                {result.note && <p className="text-xs mt-1">{result.note}</p>}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerBlobDownload(result.blob, buildOutputFilename(file.name, `-${width}x${height}`, ext));
                trackToolEvent("download", { tool_id: "photo-signature-resizer", output_format: ext });
              }}
              className="tool-btn tool-btn--sm"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Download {ext.toUpperCase()}</span>
            </button>
          </div>

          <BeforeAfterViewer
            originalUrl={result.origUrl}
            outputUrl={result.outUrl}
            originalBytes={file.size}
            outputBytes={result.blob.size}
            originalDimensions={origDims}
            outputDimensions={result.dims}
            outputMime={format}
            altName={file.name}
          />
        </div>
        )}
      </ResultAnchor>
    </div>
  );
}

