import { describe, it, expect } from "vitest";
import { countTextStats, normalizeExtraSpaces } from "@/features/text-tools/wordCounterEngine";

describe("wordCounterEngine", () => {
  it("handles empty text cleanly", () => {
    expect(countTextStats("")).toEqual({
      words: 0,
      charactersWithSpaces: 0,
      charactersWithoutSpaces: 0,
      sentences: 0,
      paragraphs: 0,
      lines: 0,
      readingTimeMinutes: 0,
      speakingTimeMinutes: 0,
    });
  });

  it("handles contractions, punctuation, emoji, and multiple paragraphs", () => {
    const sample = "Don't skip testing!\n\nEmoji 👋🏽 counts cleanly.";
    const stats = countTextStats(sample);
    expect(stats.words).toBeGreaterThanOrEqual(6);
    expect(stats.paragraphs).toBe(2);
    expect(stats.sentences).toBe(2);
    expect(stats.charactersWithoutSpaces).toBeLessThan(stats.charactersWithSpaces);
  });

  it("normalizes extra spaces while preserving paragraph separation", () => {
    expect(normalizeExtraSpaces("  Hello   world  \n\n\n\n  Next   line ")).toBe(
      "Hello world\n\nNext line",
    );
  });
});

