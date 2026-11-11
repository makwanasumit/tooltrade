// @vitest-environment node
import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  extractPdfPages,
  mergePdfBuffers,
  parsePageRangeExpression,
  splitPdfBuffer,
} from "@/features/pdf-tools/pdfProcessor";
import { buildWifiQrString, calculateContrastRatio } from "@/features/qr-tools/qrPayloadBuilder";

describe("PDF & QR pure helpers", () => {
  it("validates page range expressions accurately", () => {
    const ok = parsePageRangeExpression("1-3, 5, 8-10", 10);
    expect(ok.valid).toBe(true);
    expect(ok.groups.map((g) => g.pages)).toEqual([[1, 2, 3], [5], [8, 9, 10]]);

    expect(parsePageRangeExpression("0-2", 5).valid).toBe(false);
    expect(parsePageRangeExpression("4-2", 5).valid).toBe(false);
    expect(parsePageRangeExpression("1, 99", 5).valid).toBe(false);
  });

  it("merges and splits PDFs cleanly in memory", async () => {
    const makePdf = async (pages: number) => {
      const d = await PDFDocument.create();
      d.setAuthor("Secret Author");
      for (let i = 0; i < pages; i++) d.addPage([200, 200]);
      const bytes = await d.save();
      const copy = new Uint8Array(bytes.byteLength);
      copy.set(bytes);
      return copy.buffer;
    };

    const p1 = await makePdf(2);
    const p2 = await makePdf(3);
    const merged = await mergePdfBuffers(
      [
        { name: "a.pdf", buffer: p1 },
        { name: "b.pdf", buffer: p2 },
      ],
      true,
    );
    expect(merged.pageCount).toBe(5);

    const mergedBuf = await merged.blob.arrayBuffer();
    const reopened = await PDFDocument.load(mergedBuf);
    expect(reopened.getAuthor()).toBe("");

    const singleSplit = await splitPdfBuffer(mergedBuf, "combined.pdf", "ranges", "2-4");
    expect(singleSplit.isZip).toBe(false);
    expect(singleSplit.outputCount).toBe(1);

    const multiSplit = await splitPdfBuffer(mergedBuf, "combined.pdf", "all", "");
    expect(multiSplit.isZip).toBe(true);
    expect(multiSplit.outputCount).toBe(5);
  });

  it("escapes Wi-Fi QR fields and computes WCAG contrast ratio", () => {
    const wifi = buildWifiQrString({
      ssid: "My;Home:Net",
      password: "pass\\123",
      encryption: "WPA",
      hidden: true,
    });
    expect(wifi).toBe("WIFI:T:WPA;S:My\\;Home\\:Net;P:pass\\\\123;H:true;;");
    expect(calculateContrastRatio("#0F0F0F", "#FFFFFF")).toBeGreaterThan(13);
    expect(calculateContrastRatio("#EEEEEE", "#FFFFFF")).toBeLessThan(1.5);
  });

  it("extracts only the selected pages in selection order", async () => {
    const d = await PDFDocument.create();
    // Give every page a unique width so we can identify it after extraction.
    for (let i = 1; i <= 5; i++) d.addPage([100 + i * 10, 200]);
    const bytes = await d.save();
    const src = new Uint8Array(bytes.byteLength);
    src.set(bytes);

    const single = await extractPdfPages(src.buffer, "deck.pdf", [4, 1, 5]);
    expect(single.isZip).toBe(false);
    expect(single.filename).toBe("deck-pages-4-1-5.pdf");
    const out = await PDFDocument.load(await single.blob.arrayBuffer());
    expect(out.getPageCount()).toBe(3);
    expect(out.getPages().map((p) => p.getWidth())).toEqual([140, 110, 150]);

    const zipped = await extractPdfPages(src.buffer, "deck.pdf", [3, 2], true);
    expect(zipped.isZip).toBe(true);
    expect(zipped.outputCount).toBe(2);

    await expect(extractPdfPages(src.buffer, "deck.pdf", [])).rejects.toThrow(/at least one/i);
    await expect(extractPdfPages(src.buffer, "deck.pdf", [9])).rejects.toThrow(/out of bounds/i);
  });
});
