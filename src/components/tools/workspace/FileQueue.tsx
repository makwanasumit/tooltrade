"use client";

import React, { useEffect, useState } from "react";
import { FileText, X } from "lucide-react";
import { formatBytes } from "@/lib/file-processing/filenames";

interface FileQueueProps {
  files: readonly File[];
  onRemove?: (index: number) => void;
  disabled?: boolean;
}

/** Compact thumbnail list of the files currently queued for a batch tool. */
export function FileQueue({ files, onRemove, disabled = false }: FileQueueProps) {
  // Object URLs are created and revoked inside one effect so StrictMode's mount/unmount/mount
  // cycle never leaves <img> tags pointing at a revoked URL.
  const [thumbs, setThumbs] = useState<(string | null)[]>([]);
  useEffect(() => {
    const urls = files.map((f) => (f.type.startsWith("image/") ? URL.createObjectURL(f) : null));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThumbs(urls);
    return () => {
      urls.forEach((u) => u && URL.revokeObjectURL(u));
    };
  }, [files]);

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2" aria-label="Queued files">
      {files.map((f, i) => (
        <li key={`${f.name}-${f.size}-${i}`} className="tool-file">
          {thumbs[i] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbs[i]!} alt="" className="tool-file__thumb" />
          ) : (
            <span className="tool-file__thumb inline-flex items-center justify-center">
              <FileText className="w-4 h-4" aria-hidden="true" />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{f.name}</span>
            <span className="block font-mono text-[var(--theme-text-muted)]">{formatBytes(f.size)}</span>
          </span>
          {onRemove && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onRemove(i)}
              aria-label={`Remove ${f.name}`}
              className="shrink-0 w-7 h-7 rounded-full border-[1.5px] border-[var(--swatch-ink)] inline-flex items-center justify-center hover:bg-[var(--swatch-coral)] hover:text-white cursor-pointer disabled:opacity-40"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
