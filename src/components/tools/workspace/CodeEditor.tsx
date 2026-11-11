"use client";

import React, { useId, useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Lightweight JSON tokenizer (tolerant: also colours invalid JSON)     */
/* ------------------------------------------------------------------ */

const TOKEN_RE =
  /("(?:\\.|[^"\\\n])*"?)(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b|([{}[\],:])/g;

/** Above this size we skip colouring so typing stays instant. */
const HIGHLIGHT_LIMIT = 150_000;

export function highlightJson(text: string): React.ReactNode[] {
  if (text.length > HIGHLIGHT_LIMIT) return [text];
  const out: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of text.matchAll(TOKEN_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(text.slice(last, idx));
    if (m[1] !== undefined) {
      const isKey = m[2] !== undefined;
      out.push(
        <span key={key++} className={isKey ? "tok-key" : "tok-str"}>
          {m[1]}
        </span>,
      );
      if (m[2]) out.push(<span key={key++} className="tok-punc">{m[2]}</span>);
    } else if (m[3] !== undefined) {
      out.push(<span key={key++} className="tok-num">{m[3]}</span>);
    } else if (m[4] !== undefined) {
      out.push(<span key={key++} className="tok-lit">{m[4]}</span>);
    } else if (m[5] !== undefined) {
      out.push(<span key={key++} className="tok-punc">{m[5]}</span>);
    }
    last = idx + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/* ------------------------------------------------------------------ */
/* Code block / editor                                                  */
/* ------------------------------------------------------------------ */

interface CodeEditorProps {
  value: string;
  onChange?: (next: string) => void;
  readOnly?: boolean;
  /** filename shown in the header tab, e.g. "input.json" */
  filename: string;
  ariaLabel: string;
  placeholder?: string;
  /** 1-based line to mark as the error line */
  errorLine?: number;
  /** minimum visible lines */
  minLines?: number;
  /** maximum height before the block scrolls */
  maxHeight?: string;
  /** show a Copy button in the header */
  copyable?: boolean;
  /** disable the Copy button regardless of content (e.g. output not yet valid) */
  copyDisabled?: boolean;
  onCopied?: () => void;
  /** extra header actions (right side) */
  actions?: React.ReactNode;
  /** status chip in the footer (e.g. "Valid JSON") */
  footerNote?: React.ReactNode;
}

export function CodeEditor({
  value,
  onChange,
  readOnly = false,
  filename,
  ariaLabel,
  placeholder,
  errorLine,
  minLines = 12,
  maxHeight = "30rem",
  copyable = false,
  copyDisabled = false,
  onCopied,
  actions,
  footerNote,
}: CodeEditorProps) {
  const id = useId();
  const [copied, setCopied] = useState(false);

  const highlighted = useMemo(() => highlightJson(value), [value]);
  const lineCount = useMemo(() => value.split("\n").length, [value]);
  const shownLines = Math.max(lineCount, minLines);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopied?.();
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — nothing to do */
    }
  };

  return (
    <div className="code-block" data-readonly={readOnly}>
      <div className="code-block__bar">
        <span className="code-block__dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="code-block__file">{filename}</span>
        <span className="code-block__spacer" />
        {actions}
        {copyable && (
          <button
            type="button"
            onClick={() => void handleCopy()}
            disabled={!value || copyDisabled}
            className="code-block__btn"
            aria-label={`Copy ${filename}`}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        )}
      </div>

      <div
        className="code-block__body"
        data-lenis-prevent=""
        style={{ maxHeight, ["--min-lines" as string]: String(minLines) }}
        tabIndex={readOnly ? 0 : undefined}
      >
        <div className="code-block__gutter" aria-hidden="true">
          {Array.from({ length: shownLines }, (_, i) => (
            <span key={i} data-error={errorLine === i + 1 ? "true" : undefined}>
              {i + 1}
            </span>
          ))}
        </div>

        <div
          className="code-block__code"
          role={readOnly ? "region" : undefined}
          aria-label={readOnly ? ariaLabel : undefined}
        >
          {errorLine ? (
            <span
              className="code-block__errline"
              style={{ top: `calc(var(--code-pad) + ${errorLine - 1} * var(--code-lh))` }}
              aria-hidden="true"
            />
          ) : null}

          <pre className="code-block__pre" aria-hidden={readOnly ? undefined : "true"}>
            {value ? (
              <code>{highlighted}</code>
            ) : (
              <code className="code-block__placeholder">{placeholder ?? ""}</code>
            )}
            {"\n"}
          </pre>

          {!readOnly && (
            <textarea
              id={id}
              className="code-block__textarea"
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              aria-label={ariaLabel}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              wrap="off"
            />
          )}
        </div>
      </div>

      <div className="code-block__foot">
        <span>
          {lineCount.toLocaleString()} {lineCount === 1 ? "line" : "lines"} · {value.length.toLocaleString()} chars
        </span>
        {footerNote}
      </div>
    </div>
  );
}
