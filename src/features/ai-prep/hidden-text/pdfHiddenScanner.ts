import { scanPlainTextForHidden, type HiddenFinding } from "./textScanner";

function hasNearWhiteRawPdfMarkers(rawSample: string): boolean {
  // Heuristic check for raw PDF graphic state white-fill markers like `1 1 1 rg` or `1 g`
  return /\b1(?:\.0+)?\s+1(?:\.0+)?\s+1(?:\.0+)?\s+rg\b|\b1(?:\.0+)?\s+g\b/.test(rawSample);
}

export async function scanPdfBufferForHiddenText(
  buffer: ArrayBuffer,
  includeInstructionHeuristics: boolean,
): Promise<{ findings: HiddenFinding[]; extractedText: string; pageCount: number }> {
  const rawBytes = new Uint8Array(buffer);
  const rawSnippetSample = new TextDecoder("latin1").decode(
    rawBytes.slice(0, Math.min(rawBytes.length, 2_000_000)),
  );

  const findings: HiddenFinding[] = [];
  let counter = 0;

  // Report embedded JS safely without ever evaluating anything
  if (/\/JavaScript\b|\/JS\b|\/OpenAction\b/i.test(rawSnippetSample)) {
    counter++;
    findings.push({
      id: `pdf-js-${counter}`,
      category: "pdf-hidden",
      label: "Embedded PDF Action / JavaScript Marker",
      location: "PDF catalog/objects",
      snippet: "Detected /JS, /JavaScript, or /OpenAction dictionary key",
      reason:
        "PDF contains script or auto-action markers (reported only, never executed by this tool).",
      accuracy: "exact",
    });
  }

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/workers/pdf.worker.min.mjs";

  const loadingTask = pdfjs.getDocument({ data: rawBytes.slice() });
  const pdf = await loadingTask.promise;

  const pageTextChunks: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();
    const annotations = await page.getAnnotations();

    let pageText = "";

    for (const item of textContent.items) {
      if (!("str" in item) || !item.str.trim()) continue;
      pageText += `${item.str} `;

      const transform = item.transform as number[] | undefined;
      if (transform && transform.length >= 6) {
        const fontHeight = Math.hypot(transform[0] ?? 0, transform[1] ?? 0);
        const x = transform[4] ?? 0;
        const y = transform[5] ?? 0;

        if (fontHeight > 0 && fontHeight < 2.2) {
          counter++;
          findings.push({
            id: `pdf-tiny-${counter}`,
            category: "pdf-hidden",
            label: "Tiny PDF Text (< 2.2 pt)",
            location: `page ${pageNum}`,
            snippet: item.str.slice(0, 140),
            reason: `Font height measured at ${fontHeight.toFixed(2)} pt.`,
            accuracy: "exact",
          });
        }

        if (x < -10 || y < -10 || x > viewport.width + 10 || y > viewport.height + 10) {
          counter++;
          findings.push({
            id: `pdf-offpage-${counter}`,
            category: "pdf-hidden",
            label: "Off-Page PDF Text",
            location: `page ${pageNum} (${Math.round(x)}, ${Math.round(y)})`,
            snippet: item.str.slice(0, 140),
            reason: `Coordinates lie outside visible page bounds (${Math.round(viewport.width)}×${Math.round(viewport.height)}).`,
            accuracy: "exact",
          });
        }
      }
    }

    // Inspect operator list for invisible rendering mode (3 Tr) or white RGB/gray fill
    try {
      const opList = await page.getOperatorList();
      const OPS = pdfjs.OPS;
      let sawMode3 = false;
      let sawWhiteFill = false;

      for (let k = 0; k < opList.fnArray.length; k++) {
        const fn = opList.fnArray[k];
        const args = opList.argsArray[k];
        if (fn === OPS.setTextRenderingMode && args?.[0] === 3) {
          sawMode3 = true;
        }
        if (fn === OPS.setFillRGBColor && Array.isArray(args) && args.length >= 3) {
          // pdfjs normalizes or passes hex/rgb depending on version
          const first = args[0];
          if (typeof first === "string" && /^#f[0-9a-f]{5}$/i.test(first)) {
            sawWhiteFill = true;
          } else if (
            typeof args[0] === "number" &&
            args[0] > 0.94 &&
            args[1] > 0.94 &&
            args[2] > 0.94
          ) {
            sawWhiteFill = true;
          }
        }
      }

      if (sawMode3) {
        counter++;
        findings.push({
          id: `pdf-mode3-${counter}`,
          category: "pdf-hidden",
          label: "Invisible Text Rendering Mode (Tr = 3)",
          location: `page ${pageNum}`,
          snippet: "(PDF rendering mode 3 suppresses glyphs visually)",
          reason: "Page sets PDF text rendering mode 3 (neither filled nor stroked).",
          accuracy: "exact",
        });
      }

      if (sawWhiteFill || hasNearWhiteRawPdfMarkers(rawSnippetSample)) {
        counter++;
        findings.push({
          id: `pdf-white-${counter}`,
          category: "pdf-hidden",
          label: "Near-White Fill Color Operator",
          location: `page ${pageNum}`,
          snippet: "(Near-white fill RGB/gray detected in page operators)",
          reason: "Page contains near-white fill commands that may hide text against a white background.",
          accuracy: "heuristic",
        });
      }
    } catch {
      // Operator inspection unavailable on unusual streams; continue gracefully
    }

    if (annotations.length > 0) {
      for (const ann of annotations) {
        const annContent =
          typeof ann === "object" && ann !== null && "contentsObj" in ann
            ? String((ann as { contentsObj?: { str?: string } }).contentsObj?.str ?? "")
            : "";
        if (annContent.trim()) {
          counter++;
          findings.push({
            id: `pdf-ann-${counter}`,
            category: "pdf-hidden",
            label: "PDF Annotation Text",
            location: `page ${pageNum}`,
            snippet: annContent.slice(0, 140),
            reason: "Annotation comment text may be extracted by RAG parsers while collapsed visually.",
            accuracy: "exact",
          });
        }
      }
    }

    pageTextChunks.push(pageText.trim());
  }

  const combined = pageTextChunks.join("\n\n");
  const unicodeFindings = scanPlainTextForHidden(combined, includeInstructionHeuristics);

  return {
    findings: [...findings, ...unicodeFindings],
    extractedText: combined,
    pageCount: pdf.numPages,
  };
}

