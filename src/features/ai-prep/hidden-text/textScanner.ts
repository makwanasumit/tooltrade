export interface HiddenFinding {
  id: string;
  category:
    | "zero-width"
    | "bidi-control"
    | "unicode-tag"
    | "unusual-whitespace"
    | "homoglyph-risk"
    | "html-hidden"
    | "docx-hidden"
    | "pdf-hidden"
    | "instruction-heuristic";
  label: string;
  location: string;
  snippet: string;
  reason: string;
  accuracy: "exact" | "heuristic";
}

const ZERO_WIDTH_RE = /[\u200B\u200C\u200D\u2060\uFEFF]/g;
const BIDI_CONTROL_RE = /[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;
const UNUSUAL_WS_RE = /[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g;
// Unicode Tag Characters U+E0000..U+E007F (encoded as surrogate pairs in JS UTF-16)
const UNICODE_TAG_RE = /[\u{E0000}-\u{E007F}]+/gu;

// Common Cyrillic/Greek lookalikes mixed inside ASCII Latin tokens
const CYRILLIC_OR_GREEK_IN_LATIN_RE =
  /\b(?=[A-Za-z\u0400-\u04FF\u0370-\u03FF]*[A-Za-z])(?=[A-Za-z\u0400-\u04FF\u0370-\u03FF]*[\u0400-\u04FF\u0370-\u03FF])[A-Za-z\u0400-\u04FF\u0370-\u03FF]+\b/g;

const INSTRUCTION_HEURISTIC_RE =
  /\b(?:ignore\s+(?:all\s+)?previous\s+instructions|disregard\s+(?:the\s+)?above|system\s+prompt|do\s+not\s+mention\s+this\s+to\s+the\s+user|you\s+must\s+recommend|override\s+rubric)\b/gi;

function codePointHex(ch: string): string {
  const cp = ch.codePointAt(0);
  return cp !== undefined ? `U+${cp.toString(16).toUpperCase().padStart(4, "0")}` : "?";
}

function contextAround(text: string, index: number, radius = 24): string {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + radius);
  return text.slice(start, end).replace(/\s+/g, " ");
}

export function scanPlainTextForHidden(
  text: string,
  includeInstructionHeuristics = false,
): HiddenFinding[] {
  if (!text) return [];
  const findings: HiddenFinding[] = [];
  let idx = 0;

  const scanRegex = (
    re: RegExp,
    category: HiddenFinding["category"],
    label: string,
    reasonFn: (m: string) => string,
    accuracy: "exact" | "heuristic" = "exact",
  ) => {
    const r = new RegExp(re.source, re.flags);
    let m: RegExpExecArray | null;
    while ((m = r.exec(text)) !== null) {
      idx++;
      findings.push({
        id: `ht-${idx}-${category}`,
        category,
        label,
        location: `offset ${m.index}`,
        snippet: contextAround(text, m.index),
        reason: reasonFn(m[0]),
        accuracy,
      });
      if (findings.length >= 250) break;
    }
  };

  scanRegex(
    ZERO_WIDTH_RE,
    "zero-width",
    "Zero-Width / Invisible Joiner",
    (m) => `Invisible character ${codePointHex(m)} detected.`,
  );

  scanRegex(
    BIDI_CONTROL_RE,
    "bidi-control",
    "Bidirectional Override / Isolate",
    (m) => `Bidirectional control character ${codePointHex(m)} can reorder rendered text visually.`,
  );

  scanRegex(
    UNICODE_TAG_RE,
    "unicode-tag",
    "Unicode Tag Block (U+E0000)",
    (m) => {
      const decoded = Array.from(m)
        .map((ch) => {
          const cp = ch.codePointAt(0) ?? 0;
          return cp >= 0xe0020 && cp <= 0xe007e ? String.fromCharCode(cp - 0xe0000) : "";
        })
        .join("");
      return `Invisible Unicode tag sequence (${m.length} chars)${decoded ? ` decoding to ASCII: "${decoded}"` : ""}.`;
    },
  );

  scanRegex(
    UNUSUAL_WS_RE,
    "unusual-whitespace",
    "Unusual Non-ASCII Whitespace",
    (m) => `Non-standard space ${codePointHex(m)} detected.`,
  );

  scanRegex(
    CYRILLIC_OR_GREEK_IN_LATIN_RE,
    "homoglyph-risk",
    "Mixed-Script Homoglyph Risk",
    (m) => `Word "${m}" mixes Latin letters with Cyrillic/Greek characters.`,
    "heuristic",
  );

  if (includeInstructionHeuristics) {
    scanRegex(
      INSTRUCTION_HEURISTIC_RE,
      "instruction-heuristic",
      "Possible Prompt Instruction Phrase",
      (m) => `Matches heuristic phrase "${m}" (review manually; may be legitimate prose).`,
      "heuristic",
    );
  }

  return findings;
}

export function stripInvisibleUnicode(text: string): string {
  return text
    .replace(ZERO_WIDTH_RE, "")
    .replace(BIDI_CONTROL_RE, "")
    .replace(UNICODE_TAG_RE, "")
    .replace(UNUSUAL_WS_RE, " ");
}

