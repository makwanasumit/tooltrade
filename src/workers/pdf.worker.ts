import {
  buildPdfFromImages,
  extractPdfPages,
  mergePdfBuffers,
  splitPdfBuffer,
  type ImagePdfItem,
  type ImagesToPdfOptions,
} from "@/features/pdf-tools/pdfProcessor";

export type PdfWorkerRequest =
  | {
      id: string;
      action: "merge";
      files: Array<{ name: string; buffer: ArrayBuffer }>;
      stripMetadata: boolean;
    }
  | {
      id: string;
      action: "split";
      buffer: ArrayBuffer;
      baseFilename: string;
      mode: "all" | "ranges";
      rangeExpr: string;
    }
  | {
      id: string;
      action: "extract";
      buffer: ArrayBuffer;
      baseFilename: string;
      pages: number[];
      separate: boolean;
    }
  | {
      id: string;
      action: "images-to-pdf";
      images: ImagePdfItem[];
      options: ImagesToPdfOptions;
    };

self.onmessage = async (event: MessageEvent<PdfWorkerRequest>) => {
  const req = event.data;
  try {
    if (req.action === "merge") {
      const result = await mergePdfBuffers(req.files, req.stripMetadata);
      self.postMessage({ id: req.id, ok: true, result });
      return;
    }
    if (req.action === "split") {
      const result = await splitPdfBuffer(req.buffer, req.baseFilename, req.mode, req.rangeExpr);
      self.postMessage({ id: req.id, ok: true, result });
      return;
    }
    if (req.action === "extract") {
      const result = await extractPdfPages(req.buffer, req.baseFilename, req.pages, req.separate);
      self.postMessage({ id: req.id, ok: true, result });
      return;
    }
    if (req.action === "images-to-pdf") {
      const result = await buildPdfFromImages(req.images, req.options);
      self.postMessage({ id: req.id, ok: true, result });
      return;
    }
  } catch (err) {
    self.postMessage({
      id: req.id,
      ok: false,
      error: err instanceof Error ? err.message : "PDF worker failed.",
    });
  }
};

