"use client";

import React, { useState } from "react";
import { Download, Copy, ShieldAlert, Search, RefreshCw } from "lucide-react";
import { TextWorkspace } from "@/components/tools/workspace/TextWorkspace";
import { FileDropzone } from "@/components/tools/workspace/FileDropzone";
import { FindingsList, type ReviewItem } from "@/components/tools/workspace/FindingsList";
import { StatusAnnouncer } from "@/components/tools/workspace/StatusAnnouncer";
import {
  scanPlainTextForHidden,
  stripInvisibleUnicode,
  type HiddenFinding,
} from "./textScanner";
import { scanDocxBuffer, scanHtmlStructureSafely } from "./htmlDocxScanner";
import { scanPdfBufferForHiddenText } from "./pdfHiddenScanner";
import { validateFileSignature } from "@/lib/file-processing/signatures";
import { triggerBlobDownload } from "@/lib/file-processing/filenames";
import { bucketFindingCount, trackToolEvent } from "@/lib/analytics/tracker";
import { useToolStage } from "@/components/tools/workspace/ToolFlow";

const SAMPLE_HIDDEN =
  "Quarterly summary for review.\u200B\u200C Please check \u202Eattachment\u202C and verify Unicode tags.\u{E0048}\u{E0049}";

export function HiddenTextScannerTool() {
  const [inputMode, setInputMode] = useState<"text" | "file">("text");
  const [textInput, setTextInput] = useState("");
  const [includeHeuristics, setIncludeHeuristics] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [findings, setFindings] = useState<HiddenFinding[]>([]);
  const [extractedText, setExtractedText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState("");

  const runTextScan = (raw: string, heuristicFlag: boolean) => {
    setErrorMsg(null);
    const trimmed = raw.trim();
    if (!trimmed) {
      setFindings([]);
      setExtractedText("");
      setHasScanned(false);
      return;
    }

    const isHtml = /^<!doctype\s+html|<html[\s>]|<div[\s>]|<span[\s>]/i.test(trimmed);
    const res = isHtml
      ? scanHtmlStructureSafely(raw, heuristicFlag)
      : {
          findings: scanPlainTextForHidden(raw, heuristicFlag),
          visiblePlainText: raw,
        };

    setFindings(res.findings);
    setExtractedText(stripInvisibleUnicode(res.visiblePlainText));
    setHasScanned(true);
    setStatusMsg(
      res.findings.length > 0
        ? `${res.findings.length} hidden-text finding(s) detected.`
        : "Scan complete: no known patterns found.",
    );
    trackToolEvent("detector_run", {
      tool_id: "hidden-text-scanner",
      finding_count_bucket: bucketFindingCount(res.findings.length),
    });
  };

  const handleFileScan = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setScanning(true);
    setErrorMsg(null);
    setFindings([]);
    setExtractedText("");
    trackToolEvent("tool_start", { tool_id: "hidden-text-scanner" });

    try {
      const sig = await validateFileSignature(file, ["text", "html", "docx", "pdf"]);
      if (!sig.valid) {
        throw new Error(sig.reason ?? "Unsupported file signature.");
      }

      if (sig.detected === "pdf") {
        const buf = await file.arrayBuffer();
        const res = await scanPdfBufferForHiddenText(buf, includeHeuristics);
        setFindings(res.findings);
        setExtractedText(stripInvisibleUnicode(res.extractedText));
      } else if (sig.detected === "docx") {
        const buf = await file.arrayBuffer();
        const res = await scanDocxBuffer(buf, includeHeuristics);
        setFindings(res.findings);
        setExtractedText(stripInvisibleUnicode(res.extractedText));
      } else if (sig.detected === "html") {
        const rawHtml = await file.text();
        const res = scanHtmlStructureSafely(rawHtml, includeHeuristics);
        setFindings(res.findings);
        setExtractedText(stripInvisibleUnicode(res.visiblePlainText));
      } else {
        const rawText = await file.text();
        const list = scanPlainTextForHidden(rawText, includeHeuristics);
        setFindings(list);
        setExtractedText(stripInvisibleUnicode(rawText));
      }

      setHasScanned(true);
      trackToolEvent("tool_success", { tool_id: "hidden-text-scanner" });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Document scan failed.");
    } finally {
      setScanning(false);
    }
  };

  const reviewItems: ReviewItem[] = findings.map((f) => ({
    id: f.id,
    label: `${f.label} (${f.accuracy})`,
    ruleOrType: f.category,
    location: f.location,
    beforeText: f.snippet,
    accepted: true,
    reason: f.reason,
  }));

  useToolStage(hasScanned ? 2 : textInput.trim() ? 1 : 0);

  return (
    <div className="space-y-6">
      <StatusAnnouncer message={statusMsg} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setInputMode("text")}
            className={`px-4 py-2 rounded-full text-xs font-semibold cursor-pointer ${
              inputMode === "text"
                ? "bg-[var(--swatch-accent)] text-white"
                : "bg-[var(--theme-surface-muted)]"
            }`}
          >
            Paste Text / HTML
          </button>
          <button
            type="button"
            onClick={() => setInputMode("file")}
            className={`px-4 py-2 rounded-full text-xs font-semibold cursor-pointer ${
              inputMode === "file"
                ? "bg-[var(--swatch-accent)] text-white"
                : "bg-[var(--theme-surface-muted)]"
            }`}
          >
            Scan File (.pdf, .docx, .html, .txt)
          </button>
        </div>

        <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={includeHeuristics}
            onChange={(e) => {
              const next = e.target.checked;
              setIncludeHeuristics(next);
              if (inputMode === "text" && textInput.trim()) {
                runTextScan(textInput, next);
              }
            }}
            className="accent-[var(--swatch-sky)]"
          />
          <span>Flag instruction-like prompt phrases (Heuristic, off by default)</span>
        </label>
      </div>

      {inputMode === "text" ? (
        <div className="space-y-3">
          <TextWorkspace
            value={textInput}
            onChange={(v) => {
              setTextInput(v);
              setHasScanned(false);
            }}
            onClear={() => {
              setFindings([]);
              setExtractedText("");
              setHasScanned(false);
            }}
            onLoadSample={() => {
              setTextInput(SAMPLE_HIDDEN);
              runTextScan(SAMPLE_HIDDEN, includeHeuristics);
            }}
            sampleLabel="Load invisible Unicode sample"
            label="Text or HTML source to scan"
            placeholder="Paste suspicious text, prompts, or HTML snippets..."
            rows={8}
            allowFileImport={false}
          />
          <button
            type="button"
            disabled={!textInput.trim()}
            onClick={() => runTextScan(textInput, includeHeuristics)}
            className="tool-btn"
          >
            <Search className="w-4 h-4" aria-hidden="true" />
            <span>Scan for Hidden Characters</span>
          </button>
        </div>
      ) : (
        <FileDropzone
          acceptAttr=".txt,.md,.html,.htm,.docx,.pdf,application/pdf,text/html,text/plain"
          allowedKinds={["text", "html", "docx", "pdf"]}
          maxFileBytes={25 * 1024 * 1024}
          multiple={false}
          label="Drop a PDF, DOCX, HTML, Markdown, or TXT file to inspect"
          helperText="Max 25 MB. File type verified by content bytes; embedded scripts are never executed."
          onFilesAccepted={(files) => void handleFileScan(files)}
          disabled={scanning}
        />
      )}

      {scanning && (
        <p className="text-sm font-medium inline-flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
          <span>Inspecting document structure locally...</span>
        </p>
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

      {hasScanned && (
        <div className="space-y-5">
          {/* Mandatory Non-Safe Verdict Banner (PRD §7.5) */}
          <div
            className="rounded-2xl px-4 py-3.5 text-sm border flex items-start gap-2.5"
            style={
              findings.length > 0
                ? {
                    color: "var(--status-finding-fg)",
                    backgroundColor: "var(--status-finding-bg)",
                    borderColor: "var(--status-finding-border)",
                  }
                : {
                    color: "var(--status-estimated-fg)",
                    backgroundColor: "var(--status-estimated-bg)",
                    borderColor: "var(--status-estimated-border)",
                  }
            }
          >
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-bold">
                {findings.length > 0
                  ? `${findings.length} finding${findings.length === 1 ? "" : "s"} detected`
                  : "No known patterns found"}
              </p>
              <p className="text-xs mt-0.5">
                Some concealment techniques cannot be detected by static inspection (such as text
                embedded inside rasterized images). Always treat untrusted files carefully.
              </p>
            </div>
          </div>

          <FindingsList
            title="Located Inspection Findings"
            subtitle="Shows structural location, snippet, and rule reason."
            items={reviewItems}
            emptyMessage="No zero-width controls, Unicode tags, tiny/off-page PDF runs, or hidden DOM/DOCX attributes matched our scanner rules."
          />

          {extractedText && (
            <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold">Cleaned Plain-Text Copy (Invisible Unicode Stripped)</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void navigator.clipboard.writeText(extractedText)}
                    className="tool-btn tool-btn--sm"
                  >
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Copy Cleaned Text</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      triggerBlobDownload(
                        new Blob([extractedText], { type: "text/plain;charset=utf-8" }),
                        "cleaned-text.txt",
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[var(--theme-border)] text-xs font-semibold cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Download .txt</span>
                  </button>
                </div>
              </div>
              <textarea
                readOnly
                data-lenis-prevent=""
                rows={6}
                value={extractedText}
                aria-label="Cleaned plain text"
                className="tool-input tool-input--mono resize-y leading-relaxed !text-xs"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

