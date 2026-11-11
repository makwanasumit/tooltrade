"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, PDFDocumentLoadingTask } from "pdfjs-dist";

export interface PdfPagePreview {
  dataUrl: string;
  /** width / height of the rendered page, so tiles can reserve the right aspect ratio */
  aspect: number;
}

type Status = "loading" | "ready" | "error";

/**
 * Loads a PDF with pdf.js (entirely in the browser) and renders page thumbnails on demand.
 * Rendering is serialised through one queue so large documents never spike memory/CPU, and
 * results are JPEG data URLs (safe across React StrictMode remounts, no URL revocation needed).
 */
export function usePdfPreview(buffer: ArrayBuffer | null, thumbWidth = 300) {
  const docRef = useRef<PDFDocumentProxy | null>(null);
  const taskRef = useRef<PDFDocumentLoadingTask | null>(null);
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  const cacheRef = useRef(new Map<number, Promise<PdfPagePreview | null>>());
  const [state, setState] = useState<{ buffer: ArrayBuffer | null; status: Status }>({
    buffer: null,
    status: "loading",
  });

  useEffect(() => {
    if (!buffer) return;
    let cancelled = false;
    const cache = cacheRef.current;

    (async () => {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/workers/pdf.worker.min.mjs";
      const task = pdfjs.getDocument({ data: new Uint8Array(buffer.slice(0)) });
      taskRef.current = task;
      const doc = await task.promise;
      if (cancelled) {
        void task.destroy();
        return;
      }
      docRef.current = doc;
      setState({ buffer, status: "ready" });
    })().catch(() => {
      if (!cancelled) setState({ buffer, status: "error" });
    });

    return () => {
      cancelled = true;
      cache.clear();
      queueRef.current = Promise.resolve();
      docRef.current = null;
      const task = taskRef.current;
      taskRef.current = null;
      if (task) void task.destroy();
    };
  }, [buffer]);

  const renderPage = useCallback(
    (pageNumber: number): Promise<PdfPagePreview | null> => {
      const cached = cacheRef.current.get(pageNumber);
      if (cached) return cached;

      const job = queueRef.current.then(async () => {
        const doc = docRef.current;
        if (!doc) return null;
        try {
          const page = await doc.getPage(pageNumber);
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: thumbWidth / base.width });
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          const ctx = canvas.getContext("2d");
          if (!ctx) return null;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvas, canvasContext: ctx, viewport }).promise;
          const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
          page.cleanup();
          return { dataUrl, aspect: base.width / base.height };
        } catch {
          return null;
        }
      });
      queueRef.current = job;
      cacheRef.current.set(pageNumber, job);
      return job;
    },
    [thumbWidth],
  );

  const status: Status = buffer ? (state.buffer === buffer ? state.status : "loading") : "loading";
  return { status, renderPage };
}
