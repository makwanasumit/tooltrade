import {
  buildPdfFromImages,
  extractPdfPages,
  mergePdfBuffers,
  splitPdfBuffer,
  type ImagePdfItem,
  type ImagesToPdfOptions,
} from "./pdfProcessor";
import type { PdfWorkerRequest } from "@/workers/pdf.worker";

function executeFallback(req: PdfWorkerRequest) {
  if (req.action === "merge") {
    return mergePdfBuffers(req.files, req.stripMetadata);
  }
  if (req.action === "split") {
    return splitPdfBuffer(req.buffer, req.baseFilename, req.mode, req.rangeExpr);
  }
  if (req.action === "extract") {
    return extractPdfPages(req.buffer, req.baseFilename, req.pages, req.separate);
  }
  return buildPdfFromImages(req.images, req.options);
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type PdfWorkerPayload = DistributiveOmit<PdfWorkerRequest, "id">;

export function runPdfWorker<TResult>(req: PdfWorkerPayload): Promise<TResult> {
  const fullReq = {
    ...req,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  } as PdfWorkerRequest;

  if (typeof Worker === "undefined") {
    return executeFallback(fullReq) as Promise<TResult>;
  }

  return new Promise<TResult>((resolve, reject) => {
    const worker = new Worker(new URL("@/workers/pdf.worker.ts", import.meta.url));
    worker.onmessage = (
      ev: MessageEvent<{ id: string; ok: boolean; result?: TResult; error?: string }>,
    ) => {
      if (ev.data.id !== fullReq.id) return;
      worker.terminate();
      if (ev.data.ok && ev.data.result) {
        resolve(ev.data.result);
      } else {
        reject(new Error(ev.data.error || "PDF processing failed."));
      }
    };
    worker.onerror = () => {
      worker.terminate();
      (executeFallback(fullReq) as Promise<TResult>).then(resolve, reject);
    };
    worker.postMessage(fullReq);
  });
}

export type { ImagePdfItem, ImagesToPdfOptions };
