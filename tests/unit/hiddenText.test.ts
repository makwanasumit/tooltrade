import { describe, it, expect } from "vitest";
import {
  scanPlainTextForHidden,
  stripInvisibleUnicode,
} from "@/features/ai-prep/hidden-text/textScanner";
import { scanHtmlStructureSafely } from "@/features/ai-prep/hidden-text/htmlDocxScanner";

describe("Hidden Text Scanner", () => {
  it("detects zero-width, bidi controls, Unicode tags, and homoglyph risks", () => {
    const suspicious = "Hello\u200B world \u202Eabc\u202C p\u0430ypal \u{E0041}\u{E0042}";
    const findings = scanPlainTextForHidden(suspicious, false);
    const categories = new Set(findings.map((f) => f.category));
    expect(categories.has("zero-width")).toBe(true);
    expect(categories.has("bidi-control")).toBe(true);
    expect(categories.has("unicode-tag")).toBe(true);
    expect(categories.has("homoglyph-risk")).toBe(true);

    const cleaned = stripInvisibleUnicode(suspicious);
    expect(cleaned).not.toContain("\u200B");
    expect(cleaned).not.toContain("\u202E");
    expect(cleaned).not.toContain("\u{E0041}");
  });

  it("detects hidden HTML comments and display:none blocks safely", () => {
    const html = `<html><body><p>Visible</p><div style="display: none">Hidden prompt</div><!-- secret --></body></html>`;
    const res = scanHtmlStructureSafely(html, false);
    expect(res.findings.length).toBe(2);
    expect(res.visiblePlainText).toContain("Visible");
  });
});

