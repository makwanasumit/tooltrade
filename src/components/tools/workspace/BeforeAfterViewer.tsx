"use client";

import React from "react";
import { formatBytes } from "@/lib/file-processing/filenames";

interface BeforeAfterViewerProps {
  originalUrl: string;
  outputUrl: string;
  originalBytes: number;
  outputBytes: number;
  originalDimensions: string;
  outputDimensions: string;
  outputMime: string;
  altName: string;
}

export function BeforeAfterViewer({
  originalUrl,
  outputUrl,
  originalBytes,
  outputBytes,
  originalDimensions,
  outputDimensions,
  outputMime,
  altName,
}: BeforeAfterViewerProps) {
  const deltaBytes = originalBytes - outputBytes;
  const pct = originalBytes > 0 ? Math.round((deltaBytes / originalBytes) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface-muted)]/40 p-4">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <span>Original</span>
          <span className="font-mono text-[var(--theme-text-muted)]">
            {originalDimensions} • {formatBytes(originalBytes)}
          </span>
        </div>
        <div className="rounded-xl overflow-hidden bg-[var(--theme-surface)] border border-[var(--theme-border)] flex items-center justify-center min-h-48 max-h-72 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={originalUrl}
            alt={`Original ${altName}`}
            className="max-h-64 w-auto object-contain"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--swatch-accent)]/40 bg-[var(--swatch-accent-tint)]/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold mb-2">
          <span>Processed ({outputMime.replace("image/", "").toUpperCase()})</span>
          <span className="font-mono">
            {outputDimensions} • {formatBytes(outputBytes)}{" "}
            <span
              className="ml-1 px-2 py-0.5 rounded-full"
              style={
                pct >= 0
                  ? {
                      color: "var(--status-verified-fg)",
                      backgroundColor: "var(--status-verified-bg)",
                    }
                  : {
                      color: "var(--status-estimated-fg)",
                      backgroundColor: "var(--status-estimated-bg)",
                    }
              }
            >
              {pct >= 0 ? `-${pct}%` : `+${Math.abs(pct)}%`}
            </span>
          </span>
        </div>
        <div className="rounded-xl overflow-hidden bg-[var(--theme-surface)] border border-[var(--theme-border)] flex items-center justify-center min-h-48 max-h-72 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={outputUrl}
            alt={`Processed ${altName}`}
            className="max-h-64 w-auto object-contain"
          />
        </div>
      </div>
    </div>
  );
}

