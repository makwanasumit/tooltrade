import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { PDFDocument } from "pdf-lib";

// Valid 1x1 red PNG buffer for real browser canvas/worker image tests
const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function makePdfBuffer(pages: number): Promise<Buffer> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([200, 200]);
  return Buffer.from(await doc.save());
}

test.describe("Everyday Tools Hub — Full 16-Tool Network Audit, Functional & A11y Verification", () => {
  test("homepage renders, searches tools, and passes WCAG AA", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toBeVisible();

    const searchInput = page.getByLabel("Search for a tool by task or format");
    await searchInput.fill("LLM JSON");
    await expect(
      page.getByRole("region", { name: "Matching tools" }).getByRole("link", { name: /LLM JSON Repair/i }),
    ).toBeVisible();

    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();
    expect(axe.violations).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test("reduced motion keeps discovery text immediately visible", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toBeVisible();
    const opacity = await page.locator("h1").evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(opacity)).toBe(1);
    await context.close();
  });

  test("all 16 launch tools run locally with zero external requests and zero upload calls", async ({
    page,
  }) => {
    const externalRequests: string[] = [];
    const postLoadMutations: string[] = [];
    const pageErrors: string[] = [];
    let recordingToolCalls = false;

    page.on("pageerror", (err) => pageErrors.push(err.message));
    page.on("request", (req) => {
      const url = req.url();
      if (
        !url.startsWith("http://127.0.0.1:3100") &&
        !url.startsWith("data:") &&
        !url.startsWith("blob:")
      ) {
        externalRequests.push(`${req.method()} ${url}`);
      }
      if (recordingToolCalls && (req.resourceType() === "fetch" || req.resourceType() === "xhr")) {
        if (req.method() !== "GET") {
          postLoadMutations.push(`${req.method()} ${url}`);
        }
      }
    });

    const pngBuf = Buffer.from(TINY_PNG_BASE64, "base64");
    const pdf1 = await makePdfBuffer(1);
    const pdf3 = await makePdfBuffer(3);

    // 1. Word Counter
    await page.goto("/tools/word-counter", { waitUntil: "networkidle" });
    recordingToolCalls = true;
    await page.getByRole("button", { name: /Load sample/i }).click();
    await expect(
      page.getByText("Words", { exact: true }).locator("..").locator("p").nth(1),
    ).toHaveText(/^[34]\d$/);
    recordingToolCalls = false;

    // 2. JSON Formatter
    await page.goto("/tools/json-formatter", { waitUntil: "networkidle" });
    recordingToolCalls = true;
    await page.getByRole("button", { name: /Load sample JSON/i }).click();
    await page.getByRole("button", { name: /Validate & Format/i }).click();
    await expect(page.getByText(/Valid RFC 8259 JSON/i)).toBeVisible();
    recordingToolCalls = false;

    // 3. QR Code Generator
    await page.goto("/tools/qr-code-generator", { waitUntil: "networkidle" });
    recordingToolCalls = true;
    await expect(page.getByAltText(/Generated static QR code preview/i)).toBeVisible();
    recordingToolCalls = false;

    // 4. Age Calculator
    await page.goto("/tools/age-calculator", { waitUntil: "networkidle" });
    recordingToolCalls = true;
    await expect(page.getByText("Exact Calendar Age", { exact: true })).toBeVisible();
    recordingToolCalls = false;

    // 5. Date Difference Calculator
    await page.goto("/tools/date-difference-calculator", { waitUntil: "networkidle" });
    recordingToolCalls = true;
    await expect(page.getByText(/Elapsed Calendar Difference \(Exclusive\)/i)).toBeVisible();
    recordingToolCalls = false;

    // 6. Image Compressor
    await page.goto("/tools/image-compressor", { waitUntil: "networkidle" });
    recordingToolCalls = true;
    await page.locator('input[type="file"]').setInputFiles({
      name: "tiny.png",
      mimeType: "image/png",
      buffer: pngBuf,
    });
    await page.getByRole("button", { name: /Compress Images/i }).click();
    await expect(page.getByText(/Compressed Results/i)).toBeVisible();
    recordingToolCalls = false;

    // 7. Image Converter
    await page.goto("/tools/image-converter", { waitUntil: "networkidle" });
    recordingToolCalls = true;
    await page.locator('input[type="file"]').setInputFiles({
      name: "tiny.png",
      mimeType: "image/png",
      buffer: pngBuf,
    });
    await page.getByRole("button", { name: /Convert to WEBP/i }).click();
    await expect(page.getByText(/Converted Files \(1\)/i)).toBeVisible();
    recordingToolCalls = false;

    // 8. Image Resizer
    await page.goto("/tools/image-resizer", { waitUntil: "networkidle" });
    recordingToolCalls = true;
    await page.locator('input[type="file"]').setInputFiles({
      name: "tiny.png",
      mimeType: "image/png",
      buffer: pngBuf,
    });
    await page.getByRole("button", { name: /Resize Image/i }).click();
    await expect(page.getByText(/Resized Output/i)).toBeVisible();
    recordingToolCalls = false;

    // 9. Photo & Signature Resizer
    await page.goto("/tools/photo-signature-resizer", { waitUntil: "networkidle" });
    recordingToolCalls = true;
    await page.locator('input[type="file"]').setInputFiles({
      name: "photo.png",
      mimeType: "image/png",
      buffer: pngBuf,
    });
    await page.getByRole("button", { name: /Resize to Target KB/i }).click();
    await expect(page.getByText(/Matched your entered limits/i)).toBeVisible();
    recordingToolCalls = false;

    // 10. Merge PDF
    await page.goto("/tools/merge-pdf", { waitUntil: "networkidle" });
    recordingToolCalls = true;
    await page.locator('input[type="file"]').setInputFiles([
      { name: "doc1.pdf", mimeType: "application/pdf", buffer: pdf1 },
      { name: "doc2.pdf", mimeType: "application/pdf", buffer: pdf3 },
    ]);
    await expect(page.getByText(/2 PDF\(s\) • 4 total pages/i)).toBeVisible();
    await page.getByRole("button", { name: /Merge PDFs/i }).click();
    await expect(page.getByText(/Merged PDF ready/i)).toBeVisible();
    recordingToolCalls = false;

    // 11. Split PDF
    await page.goto("/tools/split-pdf", { waitUntil: "networkidle" });
    recordingToolCalls = true;
    await page.locator('input[type="file"]').setInputFiles({
      name: "multi.pdf",
      mimeType: "application/pdf",
      buffer: pdf3,
    });
    // Visual page picker: selection order decides output order
    await page.getByRole("button", { name: /^Page 1(,|$)/ }).click();
    await page.getByRole("button", { name: /^Page 2(,|$)/ }).click();
    await page.getByRole("button", { name: /^Split PDF$/ }).click();
    await expect(page.getByText(/Ready: multi-pages-1-2\.pdf/i)).toBeVisible();
    recordingToolCalls = false;

    // 12. JPG to PDF
    await page.goto("/tools/jpg-to-pdf", { waitUntil: "networkidle" });
    recordingToolCalls = true;
    await page.locator('input[type="file"]').setInputFiles({
      name: "scan.png",
      mimeType: "image/png",
      buffer: pngBuf,
    });
    await page.getByRole("button", { name: /Create PDF/i }).click();
    await expect(page.getByText(/PDF ready \(1 pages\)/i)).toBeVisible();
    recordingToolCalls = false;

    // 13. Safe-to-Paste Redactor + Restore flow
    await page.goto("/tools/pii-redactor", { waitUntil: "networkidle" });
    recordingToolCalls = true;
    await page.getByRole("button", { name: /Load synthetic sample/i }).click();
    const maskedOutput = await page.getByLabel("Redacted output").inputValue();
    expect(maskedOutput).toContain("[EMAIL_1]");
    expect(maskedOutput).toContain("[API_KEY_1]");
    expect(maskedOutput).not.toContain("priya.nair@acme-ops.example");

    await page
      .getByLabel("Paste AI reply with placeholders")
      .fill("Hello [EMAIL_1], key [API_KEY_1] revoked.");
    const restored = await page.getByLabel("Restored reply").inputValue();
    expect(restored).toContain("priya.nair@acme-ops.example");
    expect(restored).toContain("demo_api_key_ABCDEFGHIJKLMNOPQRSTUVWXYZ123456");

    const axeRedactor = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(axeRedactor.violations).toEqual([]);
    recordingToolCalls = false;

    // 14. LLM JSON Repair & Schema Check
    await page.goto("/tools/llm-json-repair", { waitUntil: "networkidle" });
    recordingToolCalls = true;
    await page.getByRole("button", { name: /Load broken LLM output/i }).click();
    const repairedText = await page.getByRole("region", { name: "Repaired JSON output" }).innerText();
    expect(() => JSON.parse(repairedText)).not.toThrow();
    await expect(page.getByText(/Data after the cut is missing/i)).toBeVisible();
    recordingToolCalls = false;

    // 15. Token & Context Calculator
    await page.goto("/tools/token-counter", { waitUntil: "networkidle" });
    recordingToolCalls = true;
    await page.getByRole("button", { name: /Load sample markdown/i }).click();
    await expect(page.getByText("Fits comfortably", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: /Split into Chunks/i }).click();
    await expect(page.getByText(/Chunk 1 \(/).first()).toBeVisible();
    recordingToolCalls = false;

    // 16. Hidden Text Scanner
    await page.goto("/tools/hidden-text-scanner", { waitUntil: "networkidle" });
    recordingToolCalls = true;
    await page.getByRole("button", { name: /Load invisible Unicode sample/i }).click();
    await expect(page.getByText(/\d+ findings? detected/i)).toBeVisible();
    recordingToolCalls = false;

    // Verify /accuracy page renders corpus precision/recall & passes WCAG AA
    await page.goto("/accuracy", { waitUntil: "networkidle" });
    await expect(page.getByText(/Precision: 100\.0%/i)).toBeVisible();
    await expect(page.getByText(/Recall: 100\.0%/i)).toBeVisible();
    const axeAccuracy = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(axeAccuracy.violations).toEqual([]);

    expect(pageErrors).toEqual([]);
    expect(externalRequests).toEqual([]);
    expect(postLoadMutations).toEqual([]);
  });
});
