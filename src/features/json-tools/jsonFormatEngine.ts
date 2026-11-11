export interface JsonParseResult {
  valid: boolean;
  formatted?: string;
  minified?: string;
  error?: {
    message: string;
    line?: number;
    column?: number;
    looksLikeLlmOutput: boolean;
  };
}

function getLineColFromOffset(text: string, offset: number): { line: number; column: number } {
  const safeOffset = Math.max(0, Math.min(offset, text.length));
  const slice = text.slice(0, safeOffset);
  const lines = slice.split("\n");
  return {
    line: lines.length,
    column: (lines[lines.length - 1]?.length ?? 0) + 1,
  };
}

export function looksLikeMalformedLlmJson(text: string): boolean {
  const trimmed = text.trim();
  if (/```(?:json)?/i.test(trimmed)) return true;
  if (/,\s*[}\]]/.test(trimmed)) return true;
  if (/(^|[\s{,])'[^']*'\s*:/.test(trimmed)) return true;
  if (/\b(None|True|False|undefined|NaN)\b/.test(trimmed)) return true;
  if (/^\s*\/\/|\/\*/m.test(trimmed)) return true;
  if (/^[^{\[]*[{[]/.test(trimmed) && !/^\s*[{[]/.test(trimmed)) return true;
  return false;
}

/**
 * Minimal strict-JSON scanner that returns the character offset of the first syntax error,
 * or null when the text is valid. Used when the engine's own error message carries no position
 * (newer V8 builds omit it), so the editor can still mark the offending line.
 */
export function findJsonErrorOffset(text: string): number | null {
  let i = 0;
  const n = text.length;
  const fail = (at: number): never => {
    throw at;
  };
  const ws = () => {
    while (i < n && /[ \t\n\r]/.test(text[i]!)) i++;
  };
  const string = () => {
    i++; // opening quote
    while (i < n) {
      const c = text[i]!;
      if (c === '"') {
        i++;
        return;
      }
      if (c === "\n" || c === "\r") fail(i);
      if (c === "\\") {
        const next = text[i + 1];
        if (next === "u") {
          if (!/^[0-9a-fA-F]{4}$/.test(text.slice(i + 2, i + 6))) fail(i);
          i += 6;
        } else if (next !== undefined && /["\\/bfnrt]/.test(next)) {
          i += 2;
        } else {
          fail(i);
        }
        continue;
      }
      i++;
    }
    fail(n);
  };
  const value = (): void => {
    ws();
    if (i >= n) fail(n);
    const c = text[i]!;
    if (c === "{") {
      i++;
      ws();
      if (text[i] === "}") {
        i++;
        return;
      }
      for (;;) {
        ws();
        if (text[i] !== '"') fail(i);
        string();
        ws();
        if (text[i] !== ":") fail(i);
        i++;
        value();
        ws();
        if (text[i] === ",") {
          i++;
          continue;
        }
        if (text[i] === "}") {
          i++;
          return;
        }
        fail(i);
      }
    }
    if (c === "[") {
      i++;
      ws();
      if (text[i] === "]") {
        i++;
        return;
      }
      for (;;) {
        value();
        ws();
        if (text[i] === ",") {
          i++;
          continue;
        }
        if (text[i] === "]") {
          i++;
          return;
        }
        fail(i);
      }
    }
    if (c === '"') return string();
    const num = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(text.slice(i));
    if (num && num[0].length > 0) {
      i += num[0].length;
      return;
    }
    for (const lit of ["true", "false", "null"]) {
      if (text.startsWith(lit, i)) {
        i += lit.length;
        return;
      }
    }
    fail(i);
  };

  try {
    value();
    ws();
    if (i < n) return i;
    return null;
  } catch (at) {
    return typeof at === "number" ? at : null;
  }
}

export function parseAndFormatJson(raw: string, indent: number | "\t" = 2): JsonParseResult {
  if (!raw.trim()) {
    return {
      valid: false,
      error: { message: "Input is empty.", looksLikeLlmOutput: false },
    };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      valid: true,
      formatted: JSON.stringify(parsed, null, indent),
      minified: JSON.stringify(parsed),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid JSON syntax";
    let line: number | undefined;
    let column: number | undefined;

    // Extract line/col or position reported across V8 / Firefox / Safari engines
    const lineColMatch = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);
    const posMatch = message.match(/at position\s+(\d+)/i);

    if (lineColMatch) {
      line = Number(lineColMatch[1]);
      column = Number(lineColMatch[2]);
    } else if (posMatch) {
      const pos = Number(posMatch[1]);
      if (Number.isFinite(pos)) {
        const lc = getLineColFromOffset(raw, pos);
        line = lc.line;
        column = lc.column;
      }
    }

    if (line === undefined) {
      const offset = findJsonErrorOffset(raw);
      if (offset !== null) {
        const lc = getLineColFromOffset(raw, offset);
        line = lc.line;
        column = lc.column;
      }
    }

    return {
      valid: false,
      error: {
        message,
        line,
        column,
        looksLikeLlmOutput: looksLikeMalformedLlmJson(raw),
      },
    };
  }
}

