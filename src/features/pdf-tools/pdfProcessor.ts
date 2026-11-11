import { PDFDocument, PageSizes } from "pdf-lib";
import JSZip from "jszip";
import { sanitizeFilename } from "@/lib/file-processing/filenames";

export interface PageRangeGroup {
  label: string;
  pages: number[]; // 1-based page indices
}

export function parsePageRangeExpression(
  expr: string,
  totalPages: number,
): { valid: boolean; groups: PageRangeGroup[]; error?: string } {
  const cleaned = expr.trim();
  if (!cleaned) {
    return { valid: false, groups: [], error: "Enter at least one page number or range (e.g. 1-3, 5)." };
  }

  const tokens = cleaned.split(",").map((t) => t.trim()).filter(Boolean);
  if (tokens.length === 0) {
    return { valid: false, groups: [], error: "No valid page numbers found." };
  }

  const groups: PageRangeGroup[] = [];

  for (const token of tokens) {
    const singleMatch = /^(\d+)$/.exec(token);
    if (singleMatch) {
      const page = Number(singleMatch[1]);
      if (page < 1 || page > totalPages) {
        return {
          valid: false,
          groups: [],
          error: `Page ${page} is out of bounds (document has ${totalPages} pages).`,
        };
      }
      groups.push({ label: `page-${page}`, pages: [page] });
      continue;
    }

    const rangeMatch = /^(\d+)\s*-\s*(\d+)$/.exec(token);
    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);
      if (start < 1 || end < 1 || start > totalPages || end > totalPages) {
        return {
          valid: false,
          groups: [],
          error: `Range "${token}" is outside 1–${totalPages}.`,
        };
      }
      if (start > end) {
        return {
          valid: false,
          groups: [],
          error: `Range "${token}" starts after its end page.`,
        };
      }
      const pages: number[] = [];
      for (let p = start; p <= end; p++) pages.push(p);
      groups.push({ label: `pages-${start}-${end}`, pages });
      continue;
    }

    return {
      valid: false,
      groups: [],
      error: `Invalid range token "${token}". Use numbers and hyphens separated by commas (e.g. 1-3, 5, 8-10).`,
    };
  }

  return { valid: true, groups };
}

export async function inspectPdfBytes(bytes: ArrayBuffer): Promise<{ pageCount: number }> {
  try {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: false });
    return { pageCount: doc.getPageCount() };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (/encrypt/i.test(msg)) {
      throw new Error("This PDF is password-protected or encrypted. Remove encryption first.");
    }
    throw new Error("Could not parse this PDF. It may be corrupted or use unsupported syntax.");
  }
}

export async function mergePdfBuffers(
  files: Array<{ name: string; buffer: ArrayBuffer }>,
  stripMetadata: boolean,
): Promise<{ blob: Blob; pageCount: number }> {
  const merged = await PDFDocument.create();

  for (const item of files) {
    let src: PDFDocument;
    try {
      src = await PDFDocument.load(item.buffer, { ignoreEncryption: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (/encrypt/i.test(msg)) {
        throw new Error(`"${item.name}" is encrypted/password-protected and cannot be merged.`);
      }
      throw new Error(`"${item.name}" could not be read as a valid PDF.`);
    }
    const indices = src.getPageIndices();
    const copied = await merged.copyPages(src, indices);
    copied.forEach((p) => merged.addPage(p));
  }

  if (stripMetadata) {
    merged.setTitle("");
    merged.setAuthor("");
    merged.setSubject("");
    merged.setKeywords([]);
    merged.setProducer("");
    merged.setCreator("");
  }

  const outBytes = await merged.save();
  return {
    blob: new Blob([new Uint8Array(outBytes)], { type: "application/pdf" }),
    pageCount: merged.getPageCount(),
  };
}

export async function splitPdfBuffer(
  buffer: ArrayBuffer,
  baseFilename: string,
  mode: "all" | "ranges",
  rangeExpr: string,
): Promise<{ blob: Blob; isZip: boolean; outputCount: number; filename: string }> {
  const src = await PDFDocument.load(buffer, { ignoreEncryption: false });
  const totalPages = src.getPageCount();
  const safeBase = sanitizeFilename(baseFilename.replace(/\.pdf$/i, ""), "document");

  let groups: PageRangeGroup[];
  if (mode === "all") {
    groups = Array.from({ length: totalPages }, (_, idx) => ({
      label: `page-${String(idx + 1).padStart(3, "0")}`,
      pages: [idx + 1],
    }));
  } else {
    const parsed = parsePageRangeExpression(rangeExpr, totalPages);
    if (!parsed.valid) {
      throw new Error(parsed.error || "Invalid page ranges.");
    }
    groups = parsed.groups;
  }

  if (groups.length === 1) {
    const grp = groups[0]!;
    const outDoc = await PDFDocument.create();
    const copied = await outDoc.copyPages(
      src,
      grp.pages.map((p) => p - 1),
    );
    copied.forEach((p) => outDoc.addPage(p));
    const bytes = await outDoc.save();
    return {
      blob: new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
      isZip: false,
      outputCount: 1,
      filename: `${safeBase}-${grp.label}.pdf`,
    };
  }

  const zip = new JSZip();
  for (let i = 0; i < groups.length; i++) {
    const grp = groups[i]!;
    const outDoc = await PDFDocument.create();
    const copied = await outDoc.copyPages(
      src,
      grp.pages.map((p) => p - 1),
    );
    copied.forEach((p) => outDoc.addPage(p));
    const bytes = await outDoc.save();
    zip.file(`${safeBase}-${String(i + 1).padStart(2, "0")}-${grp.label}.pdf`, bytes);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  return {
    blob: zipBlob,
    isZip: true,
    outputCount: groups.length,
    filename: `${safeBase}-split.zip`,
  };
}

/**
 * Extract an explicit, ordered list of 1-based pages. The output page order is exactly the
 * order of `pages` (i.e. the order the user selected them), duplicates are ignored.
 */
export async function extractPdfPages(
  buffer: ArrayBuffer,
  baseFilename: string,
  pages: readonly number[],
  separate = false,
): Promise<{ blob: Blob; isZip: boolean; outputCount: number; filename: string }> {
  const src = await PDFDocument.load(buffer, { ignoreEncryption: false });
  const total = src.getPageCount();
  const safeBase = sanitizeFilename(baseFilename.replace(/\.pdf$/i, ""), "document");

  const ordered: number[] = [];
  for (const p of pages) {
    if (!Number.isInteger(p) || p < 1 || p > total) {
      throw new Error(`Page ${p} is out of bounds (document has ${total} pages).`);
    }
    if (!ordered.includes(p)) ordered.push(p);
  }
  if (ordered.length === 0) {
    throw new Error("Select at least one page to extract.");
  }

  if (!separate || ordered.length === 1) {
    const outDoc = await PDFDocument.create();
    const copied = await outDoc.copyPages(
      src,
      ordered.map((p) => p - 1),
    );
    copied.forEach((pg) => outDoc.addPage(pg));
    const bytes = await outDoc.save();
    const label = ordered.length <= 8 ? `pages-${ordered.join("-")}` : `selected-${ordered.length}-pages`;
    return {
      blob: new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
      isZip: false,
      outputCount: 1,
      filename: `${safeBase}-${label}.pdf`,
    };
  }

  const zip = new JSZip();
  for (let i = 0; i < ordered.length; i++) {
    const pageNo = ordered[i]!;
    const outDoc = await PDFDocument.create();
    const [copied] = await outDoc.copyPages(src, [pageNo - 1]);
    outDoc.addPage(copied!);
    const bytes = await outDoc.save();
    zip.file(`${safeBase}-${String(i + 1).padStart(2, "0")}-page-${pageNo}.pdf`, bytes);
  }
  const zipBlob = await zip.generateAsync({ type: "blob" });
  return {
    blob: zipBlob,
    isZip: true,
    outputCount: ordered.length,
    filename: `${safeBase}-split.zip`,
  };
}

export interface ImagePdfItem {
  buffer: ArrayBuffer;
  mimeType: "image/jpeg" | "image/png";
}

export interface ImagesToPdfOptions {
  pageSize: "a4" | "letter" | "fit";
  orientation: "portrait" | "landscape";
  marginPt: number;
}

export async function buildPdfFromImages(
  images: ImagePdfItem[],
  options: ImagesToPdfOptions,
): Promise<{ blob: Blob; pageCount: number }> {
  const doc = await PDFDocument.create();

  for (const imgItem of images) {
    const embedded =
      imgItem.mimeType === "image/png"
        ? await doc.embedPng(imgItem.buffer)
        : await doc.embedJpg(imgItem.buffer);

    const imgW = embedded.width;
    const imgH = embedded.height;
    const margin = Math.max(0, Math.min(72, options.marginPt));

    let pageW: number;
    let pageH: number;

    if (options.pageSize === "fit") {
      pageW = imgW + margin * 2;
      pageH = imgH + margin * 2;
    } else {
      const base = options.pageSize === "a4" ? PageSizes.A4 : PageSizes.Letter;
      if (options.orientation === "landscape") {
        pageW = Math.max(base[0], base[1]);
        pageH = Math.min(base[0], base[1]);
      } else {
        pageW = Math.min(base[0], base[1]);
        pageH = Math.max(base[0], base[1]);
      }
    }

    const page = doc.addPage([pageW, pageH]);
    const availW = Math.max(10, pageW - margin * 2);
    const availH = Math.max(10, pageH - margin * 2);
    const scale = Math.min(availW / imgW, availH / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;

    page.drawImage(embedded, {
      x: (pageW - drawW) / 2,
      y: (pageH - drawH) / 2,
      width: drawW,
      height: drawH,
    });
  }

  const bytes = await doc.save();
  return {
    blob: new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
    pageCount: doc.getPageCount(),
  };
}

