import JSZip from "jszip";
import { scanPlainTextForHidden, type HiddenFinding } from "./textScanner";

export function scanHtmlStructureSafely(
  htmlSource: string,
  includeInstructionHeuristics: boolean,
): { findings: HiddenFinding[]; visiblePlainText: string } {
  const findings: HiddenFinding[] = [];
  let counter = 0;

  // Never inject untrusted HTML into live document DOM; use inert regex & DOMParser XML/HTML inert inspection
  const commentRe = /<!--([\s\S]*?)-->/g;
  let cm: RegExpExecArray | null;
  while ((cm = commentRe.exec(htmlSource)) !== null) {
    const inner = cm[1]?.trim() ?? "";
    if (inner) {
      counter++;
      findings.push({
        id: `html-comment-${counter}`,
        category: "html-hidden",
        label: "HTML Comment",
        location: `offset ${cm.index}`,
        snippet: inner.slice(0, 120),
        reason: "HTML comment is hidden from rendered browser view but present in raw source.",
        accuracy: "exact",
      });
    }
  }

  const hiddenStyleRe =
    /<([a-z0-9]+)([^>]*(?:display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0(?:\.0+)?(?:\s*;|\s*["'])|font-size\s*:\s*0(?:px|pt|em)?|left\s*:\s*-\d{3,}px|\bhidden\b)[^>]*)>([\s\S]*?)<\/\1>/gi;
  let hm: RegExpExecArray | null;
  while ((hm = hiddenStyleRe.exec(htmlSource)) !== null) {
    const innerText = hm[3]?.replace(/<[^>]+>/g, " ").trim() ?? "";
    if (innerText) {
      counter++;
      findings.push({
        id: `html-style-${counter}`,
        category: "html-hidden",
        label: `Hidden <${hm[1]}> Element`,
        location: `offset ${hm.index}`,
        snippet: innerText.slice(0, 140),
        reason: "Element uses CSS/HTML hiding rules (display:none, visibility:hidden, opacity:0, font-size:0, off-screen, or hidden attribute).",
        accuracy: "exact",
      });
    }
  }

  const strippedVisible = htmlSource
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const unicodeFindings = scanPlainTextForHidden(htmlSource, includeInstructionHeuristics);
  return {
    findings: [...findings, ...unicodeFindings],
    visiblePlainText: strippedVisible,
  };
}

export async function scanDocxBuffer(
  buffer: ArrayBuffer,
  includeInstructionHeuristics: boolean,
): Promise<{ findings: HiddenFinding[]; extractedText: string }> {
  const zip = await JSZip.loadAsync(buffer);
  const docXml = await zip.file("word/document.xml")?.async("string");
  if (!docXml) {
    throw new Error("Invalid DOCX archive: word/document.xml not found.");
  }

  const commentsXml = await zip.file("word/comments.xml")?.async("string");
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(docXml, "application/xml");

  const findings: HiddenFinding[] = [];
  let counter = 0;

  const runs = Array.from(xmlDoc.getElementsByTagNameNS("*", "r"));
  const textParts: string[] = [];

  runs.forEach((run, runIndex) => {
    const rPr = run.getElementsByTagNameNS("*", "rPr")[0];
    const texts = Array.from(run.getElementsByTagNameNS("*", "t"))
      .map((t) => t.textContent ?? "")
      .join("");
    const delTexts = Array.from(run.getElementsByTagNameNS("*", "delText"))
      .map((t) => t.textContent ?? "")
      .join("");

    if (texts) textParts.push(texts);

    if (delTexts) {
      counter++;
      findings.push({
        id: `docx-del-${counter}`,
        category: "docx-hidden",
        label: "DOCX Tracked Deletion",
        location: `run #${runIndex + 1}`,
        snippet: delTexts.slice(0, 140),
        reason: "Tracked-change deleted text remains embedded in document.xml.",
        accuracy: "exact",
      });
    }

    if (rPr && texts.trim()) {
      const hasVanish = rPr.getElementsByTagNameNS("*", "vanish").length > 0;
      const colorEl = rPr.getElementsByTagNameNS("*", "color")[0];
      const colorVal = colorEl?.getAttribute("w:val") ?? colorEl?.getAttribute("val") ?? "";
      const isWhite = /^ffffff$/i.test(colorVal);
      const szEl = rPr.getElementsByTagNameNS("*", "sz")[0];
      const szHalfPt = Number(szEl?.getAttribute("w:val") ?? szEl?.getAttribute("val") ?? "NaN");
      const isTiny = Number.isFinite(szHalfPt) && szHalfPt <= 4; // <= 2pt

      if (hasVanish || isWhite || isTiny) {
        counter++;
        const reasons = [
          hasVanish ? "hidden (<w:vanish/>)" : "",
          isWhite ? "white font (#FFFFFF)" : "",
          isTiny ? `tiny font (${szHalfPt / 2} pt)` : "",
        ]
          .filter(Boolean)
          .join(", ");
        findings.push({
          id: `docx-run-${counter}`,
          category: "docx-hidden",
          label: "DOCX Hidden / Styled Run",
          location: `run #${runIndex + 1}`,
          snippet: texts.slice(0, 140),
          reason: `Run carries ${reasons}.`,
          accuracy: "exact",
        });
      }
    }
  });

  if (commentsXml) {
    const cDoc = parser.parseFromString(commentsXml, "application/xml");
    const comments = Array.from(cDoc.getElementsByTagNameNS("*", "comment"));
    comments.forEach((c, idx) => {
      const content = c.textContent?.trim() ?? "";
      if (content) {
        counter++;
        findings.push({
          id: `docx-comment-${counter}`,
          category: "docx-hidden",
          label: "DOCX Review Comment",
          location: `comment #${idx + 1}`,
          snippet: content.slice(0, 140),
          reason: "Comment metadata present in word/comments.xml.",
          accuracy: "exact",
        });
      }
    });
  }

  const fullText = textParts.join(" ");
  const textFindings = scanPlainTextForHidden(fullText, includeInstructionHeuristics);

  return {
    findings: [...findings, ...textFindings],
    extractedText: fullText,
  };
}

