"use client";

import React, { useId, useState } from "react";
import { Trash2, FileText, Upload, AlertCircle } from "lucide-react";
import { validateFileSignature, type DetectedFileKind } from "@/lib/file-processing/signatures";
import { formatBytes } from "@/lib/file-processing/filenames";
import { CodeEditor } from "./CodeEditor";

interface TextWorkspaceProps {
  value: string;
  onChange: (next: string) => void;
  onClear?: () => void;
  onLoadSample?: () => void;
  sampleLabel?: string;
  label: string;
  placeholder: string;
  maxBytes?: number;
  rows?: number;
  monospace?: boolean;
  allowFileImport?: boolean;
  acceptedExtensions?: string;
  allowedKinds?: readonly DetectedFileKind[];
  /** Render a syntax-highlighted code editor (JSON) with this filename instead of a plain textarea. */
  codeFilename?: string;
  /** 1-based line to flag in the code editor. */
  errorLine?: number;
}

export function TextWorkspace({
  value,
  onChange,
  onClear,
  onLoadSample,
  sampleLabel = "Load sample",
  label,
  placeholder,
  maxBytes = 2 * 1024 * 1024,
  rows = 10,
  monospace = false,
  allowFileImport = true,
  acceptedExtensions = ".txt,.md,.json,.csv,.log",
  allowedKinds = ["text", "html"],
  codeFilename,
  errorLine,
}: TextWorkspaceProps) {
  const textareaId = useId();
  const fileInputId = useId();
  const [fileError, setFileError] = useState<string | null>(null);

  const byteCount = new TextEncoder().encode(value).length;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setFileError(null);
    if (file.size > maxBytes) {
      setFileError(
        `File "${file.name}" (${formatBytes(file.size)}) exceeds the ${formatBytes(maxBytes)} text workspace limit.`,
      );
      return;
    }
    const check = await validateFileSignature(file, allowedKinds);
    if (!check.valid) {
      setFileError(check.reason ?? "Unsupported file content.");
      return;
    }
    const text = await file.text();
    onChange(text);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {codeFilename ? (
          <span className="text-sm font-semibold text-[var(--theme-text)]">{label}</span>
        ) : (
          <label htmlFor={textareaId} className="text-sm font-semibold text-[var(--theme-text)]">
            {label}
          </label>
        )}

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {onLoadSample && (
            <button
              type="button"
              onClick={onLoadSample}
              className="tool-btn tool-btn--ghost tool-btn--sm"
            >
              <FileText className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{sampleLabel}</span>
            </button>
          )}

          {allowFileImport && (
            <>
              <input
                id={fileInputId}
                type="file"
                accept={acceptedExtensions}
                className="sr-only"
                onChange={(e) => {
                  void handleFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <label
                htmlFor={fileInputId}
                tabIndex={0}
                className="tool-btn tool-btn--ghost tool-btn--sm"
              >
                <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Import file</span>
              </label>
            </>
          )}

          {value.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setFileError(null);
                onChange("");
                onClear?.();
              }}
              className="tool-btn tool-btn--danger-ghost tool-btn--sm"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {codeFilename ? (
        <CodeEditor
          value={value}
          onChange={(next) => {
            setFileError(null);
            onChange(next);
          }}
          filename={codeFilename}
          ariaLabel={label}
          placeholder={placeholder}
          errorLine={errorLine}
          minLines={rows}
        />
      ) : (
        <textarea
          id={textareaId}
          data-lenis-prevent=""
          rows={rows}
          value={value}
          onChange={(e) => {
            setFileError(null);
            onChange(e.target.value);
          }}
          placeholder={placeholder}
          spellCheck={!monospace}
          className={`tool-input !p-4 leading-relaxed resize-y ${monospace ? "tool-input--mono" : ""}`}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--theme-text-muted)]">
        <span>
          {value.length.toLocaleString()} characters • {formatBytes(byteCount)} /{" "}
          {formatBytes(maxBytes)} max
        </span>
        <span>Stays in browser memory only</span>
      </div>

      {fileError && (
        <div
          role="alert"
          className="rounded-xl px-3.5 py-2.5 text-xs border flex items-center gap-2"
          style={{
            color: "var(--status-finding-fg)",
            backgroundColor: "var(--status-finding-bg)",
            borderColor: "var(--status-finding-border)",
          }}
        >
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{fileError}</span>
        </div>
      )}
    </div>
  );
}

