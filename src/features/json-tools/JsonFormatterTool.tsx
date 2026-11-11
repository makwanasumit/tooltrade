"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, Download, Minimize2, Sparkles, Wand2 } from "lucide-react";
import { TextWorkspace } from "@/components/tools/workspace/TextWorkspace";
import { CodeEditor } from "@/components/tools/workspace/CodeEditor";
import { StatusAnnouncer } from "@/components/tools/workspace/StatusAnnouncer";
import { parseAndFormatJson } from "./jsonFormatEngine";
import { triggerBlobDownload } from "@/lib/file-processing/filenames";
import { trackToolEvent } from "@/lib/analytics/tracker";
import { useToolStage } from "@/components/tools/workspace/ToolFlow";

const SAMPLE_JSON = `{
  "service": "everyday-tools-hub",
  "localOnly": true,
  "wave": 0,
  "features": ["compress", "merge", "validate"]
}`;

export function JsonFormatterTool() {
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState<2 | 4 | "\t">(2);
  const [output, setOutput] = useState("");
  const [errorInfo, setErrorInfo] = useState<{
    message: string;
    line?: number;
    column?: number;
    looksLikeLlmOutput: boolean;
  } | null>(null);
  const [statusMsg, setStatusMsg] = useState("");

  const runAction = (mode: "format" | "minify") => {
    trackToolEvent("tool_start", { tool_id: "json-formatter" });
    const res = parseAndFormatJson(input, indent);
    if (!res.valid) {
      setErrorInfo(res.error ?? { message: "Invalid JSON", looksLikeLlmOutput: false });
      setOutput("");
      setStatusMsg(`Invalid JSON: ${res.error?.message ?? "Parse error"}`);
      trackToolEvent("tool_error", { tool_id: "json-formatter", error_code: "syntax_error" });
      return;
    }
    setErrorInfo(null);
    const next = mode === "minify" ? res.minified ?? "" : res.formatted ?? "";
    setOutput(next);
    setStatusMsg(mode === "minify" ? "Valid JSON minified." : "Valid JSON formatted.");
    trackToolEvent("tool_success", { tool_id: "json-formatter" });
  };

  const handleDownload = () => {
    const val = output || input;
    if (!val) return;
    triggerBlobDownload(new Blob([val], { type: "application/json" }), "formatted.json");
    trackToolEvent("download", { tool_id: "json-formatter", output_format: "json" });
  };

  useToolStage(output ? 2 : input.trim() ? 1 : 0);

  return (
    <div className="space-y-5">
      <StatusAnnouncer message={statusMsg} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          <TextWorkspace
            value={input}
            onChange={(next) => {
              setInput(next);
              setErrorInfo(null);
            }}
            onClear={() => {
              setOutput("");
              setErrorInfo(null);
              setStatusMsg("Cleared JSON workspace.");
            }}
            onLoadSample={() => {
              setInput(SAMPLE_JSON);
              setErrorInfo(null);
            }}
            sampleLabel="Load sample JSON"
            label="Input JSON"
            placeholder='{"hello": "world"}'
            rows={14}
            monospace
            acceptedExtensions=".json,.txt"
            codeFilename="input.json"
            errorLine={errorInfo?.line}
          />
        </div>

        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-[var(--theme-text)]">Output</span>
            <label className="inline-flex items-center gap-2 text-xs text-[var(--theme-text-muted)]">
              <span>Indent:</span>
              <select
                value={indent === "\t" ? "tab" : String(indent)}
                onChange={(e) => {
                  const v = e.target.value;
                  setIndent(v === "tab" ? "\t" : v === "4" ? 4 : 2);
                }}
                className="tool-input !w-auto !py-1 !px-2.5 !text-xs !rounded-lg"
              >
                <option value="2">2 spaces</option>
                <option value="4">4 spaces</option>
                <option value="tab">Tab</option>
              </select>
            </label>
          </div>

          <CodeEditor
            readOnly
            copyable
            value={output}
            filename="formatted.json"
            ariaLabel="Formatted JSON output"
            placeholder="Validated and formatted JSON appears here..."
            minLines={14}
            onCopied={() => {
              setStatusMsg("JSON copied to clipboard.");
              trackToolEvent("copy_result", { tool_id: "json-formatter" });
            }}
            footerNote={
              output ? (
                <span className="code-ok">✓ valid</span>
              ) : errorInfo ? (
                <span className="code-bad">✗ invalid</span>
              ) : null
            }
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => runAction("format")}
          className="tool-btn"
        >
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          <span>Validate &amp; Format</span>
        </button>

        <button
          type="button"
          onClick={() => runAction("minify")}
          className="tool-btn tool-btn--ghost"
        >
          <Minimize2 className="w-4 h-4" aria-hidden="true" />
          <span>Minify</span>
        </button>

        <button
          type="button"
          disabled={!output && !input}
          onClick={handleDownload}
          className="tool-btn tool-btn--ghost"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          <span>Download .json</span>
        </button>
      </div>

      {/* Parse Feedback */}
      {output && !errorInfo && (
        <div
          className="rounded-xl px-4 py-3 text-sm border flex items-center gap-2 font-medium"
          style={{
            color: "var(--status-verified-fg)",
            backgroundColor: "var(--status-verified-bg)",
            borderColor: "var(--status-verified-border)",
          }}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Valid RFC 8259 JSON.</span>
        </div>
      )}

      {errorInfo && (
        <div
          role="alert"
          className="rounded-xl px-4 py-3.5 text-sm border space-y-2"
          style={{
            color: "var(--status-finding-fg)",
            backgroundColor: "var(--status-finding-bg)",
            borderColor: "var(--status-finding-border)",
          }}
        >
          <div className="flex items-start gap-2 font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p>
                {errorInfo.line && errorInfo.column
                  ? `Syntax error at line ${errorInfo.line}, column ${errorInfo.column}: `
                  : "Syntax error: "}
                {errorInfo.message}
              </p>
            </div>
          </div>
          {errorInfo.looksLikeLlmOutput && (
            <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
              <span>This looks like model-generated or non-strict JSON (fences, trailing commas, or quotes).</span>
              <Link
                href="/tools/llm-json-repair"
                onClick={() =>
                  trackToolEvent("ai_prep_cross_use", {
                    source_tool_id: "json-formatter",
                    destination_tool_id: "llm-json-repair",
                  })
                }
                className="inline-flex items-center gap-1 font-bold underline"
              >
                <Wand2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Try LLM JSON Repair →</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

