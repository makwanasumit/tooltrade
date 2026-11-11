export interface RepairChange {
  id: string;
  rule: string;
  label: string;
  location: string;
  beforeText: string;
  afterText: string;
  accepted: boolean;
}

export interface JsonRepairOutput {
  repairedText: string;
  parsesCleanly: boolean;
  parseError?: string;
  status: "unchanged" | "repaired" | "unrepairable";
  truncatedDetected: boolean;
  changes: RepairChange[];
}

function stripFencesAndProse(
  input: string,
): { text: string; changed: boolean; before: string; after: string } {
  const trimmed = input.trim();
  const fenceMatch = /^```(?:json|jsonc|javascript|js)?\s*\n?([\s\S]*?)\n?```\s*$/i.exec(trimmed);
  if (fenceMatch) {
    const inner = fenceMatch[1]!.trim();
    return {
      text: inner,
      changed: true,
      before: trimmed.slice(0, 48),
      after: inner.slice(0, 48),
    };
  }

  // Handle prose wrapper before/after JSON block when clear outer { } or [ ] exist
  const firstOpen = trimmed.search(/[{[]/);
  const lastBrace = trimmed.lastIndexOf("}");
  const lastBracket = trimmed.lastIndexOf("]");
  const lastClose = Math.max(lastBrace, lastBracket);

  if (firstOpen > 0 || (lastClose >= 0 && lastClose < trimmed.length - 1)) {
    const inner =
      lastClose > firstOpen ? trimmed.slice(firstOpen, lastClose + 1) : trimmed.slice(firstOpen);
    return {
      text: inner,
      changed: inner !== input,
      before: trimmed.slice(0, 48),
      after: inner.slice(0, 48),
    };
  }

  return { text: input, changed: false, before: "", after: "" };
}

function repairTokenStream(
  src: string,
  disabledRules: Set<string>,
): { text: string; changes: RepairChange[]; truncated: boolean } {
  const changes: RepairChange[] = [];
  let out = "";
  let i = 0;
  const n = src.length;
  const stack: Array<"{" | "["> = [];
  let changeCounter = 0;

  const pushChange = (
    rule: string,
    label: string,
    offset: number,
    beforeText: string,
    afterText: string,
  ) => {
    changeCounter++;
    changes.push({
      id: `rep-${changeCounter}-${rule}`,
      rule,
      label,
      location: `offset ${offset}`,
      beforeText,
      afterText,
      accepted: true,
    });
  };

  const peekNonWs = (from: number): string => {
    let k = from;
    while (k < n && /\s/.test(src[k]!)) k++;
    return src[k] ?? "";
  };

  while (i < n) {
    const ch = src[i]!;

    // 1. Line or block comments outside strings
    if (!disabledRules.has("strip_comments") && ch === "/" && src[i + 1] === "/") {
      const start = i;
      while (i < n && src[i] !== "\n") i++;
      pushChange("strip_comments", "Removed line comment", start, src.slice(start, start + 40), "");
      continue;
    }
    if (!disabledRules.has("strip_comments") && ch === "/" && src[i + 1] === "*") {
      const start = i;
      i += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) i++;
      if (i < n) i += 2;
      pushChange("strip_comments", "Removed block comment", start, src.slice(start, start + 40), "");
      continue;
    }

    // 2. Double-quoted string literal (handle raw newlines inside string)
    if (ch === '"') {
      const start = i;
      out += '"';
      i++;
      let closed = false;
      while (i < n) {
        const c = src[i]!;
        if (c === "\\") {
          out += c + (src[i + 1] ?? "");
          i += 2;
          continue;
        }
        if (c === '"') {
          out += '"';
          i++;
          closed = true;
          break;
        }
        if ((c === "\n" || c === "\r") && !disabledRules.has("escape_control_newlines")) {
          out += c === "\n" ? "\\n" : "\\r";
          pushChange("escape_control_newlines", "Escaped literal newline in string", i, "\\n (raw)", "\\\\n");
          i++;
          continue;
        }
        out += c;
        i++;
      }
      if (!closed && !disabledRules.has("close_truncated_structure")) {
        out += '"';
        pushChange("close_truncated_structure", "Closed truncated string", start, "(unclosed)", '"');
        return { text: closeRemainingStack(out, stack, changes, pushChange), changes, truncated: true };
      }
      continue;
    }

    // 3. Single-quoted string literal -> convert to double quotes
    if (ch === "'" && !disabledRules.has("normalize_single_quotes")) {
      const start = i;
      let inner = "";
      i++;
      let closed = false;
      while (i < n) {
        const c = src[i]!;
        if (c === "\\") {
          const next = src[i + 1] ?? "";
          if (next === "'") {
            inner += "'";
          } else {
            inner += c + next;
          }
          i += 2;
          continue;
        }
        if (c === "'") {
          i++;
          closed = true;
          break;
        }
        if (c === '"') {
          inner += '\\"';
        } else if (c === "\n") {
          inner += "\\n";
        } else {
          inner += c;
        }
        i++;
      }
      const replacement = `"${inner}"`;
      out += replacement;
      pushChange(
        "normalize_single_quotes",
        "Converted single-quoted string",
        start,
        src.slice(start, Math.min(n, start + 36)),
        replacement.slice(0, 36),
      );
      if (!closed && !disabledRules.has("close_truncated_structure")) {
        return { text: closeRemainingStack(out, stack, changes, pushChange), changes, truncated: true };
      }
      continue;
    }

    // 4. Trailing comma before } or ]
    if (ch === "," && !disabledRules.has("remove_trailing_commas")) {
      const nextChar = peekNonWs(i + 1);
      if (nextChar === "}" || nextChar === "]" || nextChar === "") {
        pushChange("remove_trailing_commas", "Removed trailing comma", i, ",", "");
        i++;
        continue;
      }
    }

    // 5. Structural brackets
    if (ch === "{" || ch === "[") {
      stack.push(ch);
      out += ch;
      i++;
      continue;
    }

    if (ch === "}" || ch === "]") {
      if (stack.length > 0) stack.pop();
      out += ch;
      i++;
      continue;
    }

    // 6. Identifiers outside strings (Python/JS literals or unquoted object keys)
    if (/[A-Za-z_$]/.test(ch)) {
      const start = i;
      while (i < n && /[A-Za-z0-9_$-]/.test(src[i]!)) i++;
      const ident = src.slice(start, i);
      const nextNonWs = peekNonWs(i);

      if (nextNonWs === ":" && !disabledRules.has("quote_unquoted_keys")) {
        const quoted = `"${ident}"`;
        out += quoted;
        pushChange("quote_unquoted_keys", "Quoted unquoted object key", start, ident, quoted);
        continue;
      }

      if (!disabledRules.has("normalize_python_literals")) {
        const literalMap: Record<string, string> = {
          True: "true",
          False: "false",
          None: "null",
          undefined: "null",
          NaN: "null",
          Infinity: "null",
        };
        const mapped = literalMap[ident];
        if (mapped) {
          out += mapped;
          pushChange("normalize_python_literals", `Normalized ${ident} literal`, start, ident, mapped);
          continue;
        }
      }

      out += ident;
      continue;
    }

    out += ch;
    i++;
  }

  let truncated = false;
  if (stack.length > 0 && !disabledRules.has("close_truncated_structure")) {
    truncated = true;
    out = closeRemainingStack(out, stack, changes, pushChange);
  }

  return { text: out, changes, truncated };
}

function closeRemainingStack(
  current: string,
  stack: Array<"{" | "[">,
  changes: RepairChange[],
  pushChange: (
    rule: string,
    label: string,
    offset: number,
    beforeText: string,
    afterText: string,
  ) => void,
): string {
  let result = current.replace(/,\s*$/, "");
  // If output ended right after a key colon like `"key":`, emit explicit null placeholder ONLY if invalid?
  // Per PRD §7.2: never invent values; close brackets only!
  const closers: string[] = [];
  while (stack.length > 0) {
    const open = stack.pop();
    closers.push(open === "{" ? "}" : "]");
  }
  if (closers.length > 0) {
    const closingStr = closers.join("");
    result += closingStr;
    pushChange(
      "close_truncated_structure",
      "Closed unclosed brackets/braces at end",
      current.length,
      "(EOF)",
      closingStr,
    );
  }
  void changes;
  return result;
}

export function repairLlmJson(
  rawInput: string,
  disabledRules: ReadonlySet<string> = new Set(),
): JsonRepairOutput {
  if (!rawInput.trim()) {
    return {
      repairedText: "",
      parsesCleanly: false,
      parseError: "Input is empty.",
      status: "unrepairable",
      truncatedDetected: false,
      changes: [],
    };
  }

  // Fast path: already strict valid JSON
  try {
    const parsed = JSON.parse(rawInput);
    return {
      repairedText: JSON.stringify(parsed, null, 2),
      parsesCleanly: true,
      status: "unchanged",
      truncatedDetected: false,
      changes: [],
    };
  } catch {
    // Proceed to deterministic repair pipeline
  }

  const allChanges: RepairChange[] = [];
  let working = rawInput;

  if (!disabledRules.has("strip_markdown_fences")) {
    const fenceRes = stripFencesAndProse(working);
    if (fenceRes.changed) {
      working = fenceRes.text;
      allChanges.push({
        id: "rep-0-strip_markdown_fences",
        rule: "strip_markdown_fences",
        label: "Stripped markdown fences / surrounding prose",
        location: "outer wrapper",
        beforeText: fenceRes.before,
        afterText: fenceRes.after,
        accepted: true,
      });
    }
  }

  const streamRes = repairTokenStream(working, new Set(disabledRules));
  allChanges.push(...streamRes.changes);

  try {
    const parsed = JSON.parse(streamRes.text);
    return {
      repairedText: JSON.stringify(parsed, null, 2),
      parsesCleanly: true,
      status: allChanges.length > 0 ? "repaired" : "unchanged",
      truncatedDetected: streamRes.truncated,
      changes: allChanges,
    };
  } catch (err) {
    return {
      repairedText: streamRes.text,
      parsesCleanly: false,
      parseError: err instanceof Error ? err.message : "Syntax still invalid after enabled rules.",
      status: "unrepairable",
      truncatedDetected: streamRes.truncated,
      changes: allChanges,
    };
  }
}

