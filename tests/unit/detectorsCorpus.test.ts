import { describe, it, expect } from "vitest";
import { evaluateDetectorCorpus } from "@/lib/detectors/corpus";
import { buildRedactionPlan, restoreRedactedReply } from "@/features/ai-prep/redactor/redactorEngine";
import { passesIbanMod97, passesLuhn } from "@/lib/detectors/registry";

describe("Detectors & Safe-to-Paste Redactor", () => {
  it("validates Luhn cards and IBAN mod-97 checksums accurately", () => {
    expect(passesLuhn("4532 0151 1283 0366")).toBe(true);
    expect(passesLuhn("4532 0151 1283 0367")).toBe(false);
    expect(passesIbanMod97("DE89 3704 0044 0532 0130 00")).toBe(true);
    expect(passesIbanMod97("DE00 3704 0044 0532 0130 00")).toBe(false);
  });

  it("achieves 100% precision and recall on the published synthetic corpus", () => {
    const report = evaluateDetectorCorpus();
    expect(report.falsePositives).toBe(0);
    expect(report.falseNegatives).toBe(0);
    expect(report.precision).toBe(1);
    expect(report.recall).toBe(1);
  });

  it("masks consistently and restores AI reply purely from memory map", () => {
    const src = "Email alice@example.com twice: alice@example.com";
    const plan = buildRedactionPlan(src, new Set(), [], "labelled");
    expect(plan.maskedText).toBe("Email [EMAIL_1] twice: [EMAIL_1]");
    expect(plan.placeholderToOriginal.get("[EMAIL_1]")).toBe("alice@example.com");

    const restored = restoreRedactedReply("Draft reply to [EMAIL_1].", plan.placeholderToOriginal);
    expect(restored.restoredText).toBe("Draft reply to alice@example.com.");
    expect(restored.restoredCount).toBe(1);
  });
});

