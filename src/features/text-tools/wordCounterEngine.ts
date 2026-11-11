export interface WordCountStats {
  words: number;
  charactersWithSpaces: number;
  charactersWithoutSpaces: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  readingTimeMinutes: number;
  speakingTimeMinutes: number;
}

export function countTextStats(text: string): WordCountStats {
  if (!text) {
    return {
      words: 0,
      charactersWithSpaces: 0,
      charactersWithoutSpaces: 0,
      sentences: 0,
      paragraphs: 0,
      lines: 0,
      readingTimeMinutes: 0,
      speakingTimeMinutes: 0,
    };
  }

  // Grapheme-aware character length so emoji / surrogate pairs don't inflate wildly
  let charCount = 0;
  let charNoSpaces = 0;
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const graphemeSeg = new Intl.Segmenter("en", { granularity: "grapheme" });
    for (const seg of graphemeSeg.segment(text)) {
      charCount++;
      if (!/^\s+$/.test(seg.segment)) {
        charNoSpaces++;
      }
    }
  } else {
    const chars = Array.from(text);
    charCount = chars.length;
    charNoSpaces = chars.filter((c) => !/\s/.test(c)).length;
  }

  // Word counting via Intl.Segmenter (handles CJK, apostrophes, punctuation cleanly)
  let words = 0;
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const wordSeg = new Intl.Segmenter("en", { granularity: "word" });
    for (const seg of wordSeg.segment(text)) {
      if (seg.isWordLike) words++;
    }
  } else {
    const trimmed = text.trim();
    words = trimmed ? trimmed.split(/\s+/).length : 0;
  }

  // Sentences (split on terminal punctuation followed by whitespace or end, ignoring decimals)
  const trimmed = text.trim();
  const sentenceMatches = trimmed
    ? trimmed
        .split(/(?<=[.!?])\s+(?=[\p{L}\p{N}"'([{])/u)
        .filter((s) => s.trim().length > 0)
    : [];
  const sentences = trimmed.length === 0 ? 0 : Math.max(1, sentenceMatches.length);

  const paragraphs = trimmed
    ? trimmed.split(/\n\s*\n+/).filter((p) => p.trim().length > 0).length
    : 0;

  const lines = text.split(/\r?\n/).length;

  return {
    words,
    charactersWithSpaces: charCount,
    charactersWithoutSpaces: charNoSpaces,
    sentences,
    paragraphs,
    lines,
    readingTimeMinutes: words === 0 ? 0 : Math.max(1, Math.ceil(words / 225)),
    speakingTimeMinutes: words === 0 ? 0 : Math.max(1, Math.ceil(words / 130)),
  };
}

export function normalizeExtraSpaces(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

