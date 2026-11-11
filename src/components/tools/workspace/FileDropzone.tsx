"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { UploadCloud, AlertCircle, CheckCircle2 } from "lucide-react";
import { validateFileSignature, type DetectedFileKind } from "@/lib/file-processing/signatures";
import { formatBytes } from "@/lib/file-processing/filenames";

interface FileDropzoneProps {
  acceptAttr: string;
  allowedKinds: readonly DetectedFileKind[];
  maxFileBytes: number;
  maxFiles?: number;
  multiple?: boolean;
  label: string;
  helperText: string;
  onFilesAccepted: (files: File[]) => void;
  disabled?: boolean;
  /** "replace" swaps the queue, "add" appends (used by merge-style tools). */
  mode?: "replace" | "add";
  /** Allow Ctrl/Cmd+V of copied files/screenshots anywhere on the page. */
  allowPaste?: boolean;
  /** Controlled count of files the tool currently holds; keeps the compact bar in sync with Reset/Clear. */
  count?: number;
}

export function FileDropzone({
  acceptAttr,
  allowedKinds,
  maxFileBytes,
  maxFiles = 20,
  multiple = false,
  label,
  helperText,
  onFilesAccepted,
  disabled = false,
  mode = "replace",
  allowPaste = true,
  count,
}: FileDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const processRef = useRef<(files: FileList | File[]) => Promise<void>>(async () => {});

  const processCandidateFiles = async (rawFiles: FileList | File[]) => {
    setErrorMsg(null);
    const list = Array.from(rawFiles);
    if (list.length === 0) return;

    if (!multiple && list.length > 1) {
      setErrorMsg("Please select one file for this tool.");
      return;
    }

    if (list.length > maxFiles) {
      setErrorMsg(`Too many files selected (maximum ${maxFiles} per batch).`);
      return;
    }

    const accepted: File[] = [];
    const errors: string[] = [];

    for (const file of list) {
      if (file.size === 0) {
        errors.push(`"${file.name}" is empty (0 bytes).`);
        continue;
      }
      if (file.size > maxFileBytes) {
        errors.push(
          `"${file.name}" (${formatBytes(file.size)}) exceeds the ${formatBytes(maxFileBytes)} limit.`,
        );
        continue;
      }
      const sig = await validateFileSignature(file, allowedKinds);
      if (!sig.valid) {
        errors.push(`"${file.name}": ${sig.reason ?? "Unsupported file signature."}`);
        continue;
      }
      accepted.push(file);
    }

    if (errors.length > 0) {
      setErrorMsg(errors.join(" "));
    }
    if (accepted.length > 0) {
      setLoadedCount((c) => (mode === "add" ? c + accepted.length : accepted.length));
      onFilesAccepted(accepted);
    }
  };
  useEffect(() => {
    processRef.current = processCandidateFiles;
  });

  // Paste support: screenshots / copied files land straight in the queue.
  useEffect(() => {
    if (!allowPaste || disabled) return;
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const files = e.clipboardData?.files;
      if (files && files.length > 0) {
        e.preventDefault();
        void processRef.current(files);
      }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [allowPaste, disabled]);

  const shownCount = count ?? loadedCount;
  const compact = shownCount > 0;

  const openPicker = () => inputRef.current?.click();

  return (
    <div>
      <div
        data-dragging={dragging}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled && e.dataTransfer.files) {
            void processCandidateFiles(e.dataTransfer.files);
          }
        }}
        className={`tool-dropzone ${compact ? "tool-dropzone--compact" : ""} ${
          disabled ? "opacity-60 pointer-events-none" : ""
        }`}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={acceptAttr}
          multiple={multiple}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) {
              void processCandidateFiles(e.target.files);
            }
            e.target.value = "";
          }}
        />

        {compact ? (
          <>
            <p className="flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4 text-[var(--status-verified-fg)]" aria-hidden="true" />
              <span>
                {shownCount} {shownCount === 1 ? "file" : "files"} loaded
              </span>
              <span className="hidden sm:inline text-xs font-normal text-[var(--theme-text-muted)]">
                — drop more here{allowPaste ? " or paste" : ""}
              </span>
            </p>
            <label
              htmlFor={inputId}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openPicker();
                }
              }}
              className="tool-btn tool-btn--ghost tool-btn--sm"
            >
              {mode === "add" ? "Add more" : multiple ? "Replace files" : "Replace file"}
            </label>
          </>
        ) : (
          <>
            <UploadCloud className="w-10 h-10 mx-auto mb-3" strokeWidth={1.5} aria-hidden="true" />
            <p className="font-heading font-bold text-lg sm:text-xl tracking-tight text-[var(--theme-text)]">
              {label}
            </p>
            <p className="text-xs sm:text-sm text-[var(--theme-text-muted)] mt-1.5 max-w-xl mx-auto">
              {helperText}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <label
                htmlFor={inputId}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openPicker();
                  }
                }}
                className="tool-btn"
              >
                Choose {multiple ? "files" : "file"}
              </label>
              <span className="tool-hint hidden sm:inline">
                or drag &amp; drop{allowPaste ? " · paste with " : ""}
                {allowPaste && <kbd className="tool-kbd">Ctrl/⌘ V</kbd>}
              </span>
            </div>
          </>
        )}
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mt-3 rounded-xl px-4 py-3 text-sm border-[1.5px] flex items-start gap-2.5"
          style={{
            color: "var(--status-finding-fg)",
            backgroundColor: "var(--status-finding-bg)",
            borderColor: "var(--status-finding-fg)",
          }}
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
