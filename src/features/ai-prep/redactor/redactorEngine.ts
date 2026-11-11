import { runDetectors } from "@/lib/detectors/runner";
import type { DetectorMatch } from "@/lib/detectors/registry";

export interface RedactionFinding extends DetectorMatch {
  accepted: boolean;
  placeholder: string;
}

export interface RedactionPlan {
  maskedText: string;
  findings: RedactionFinding[];
  placeholderToOriginal: Map<string, string>;
  countsByLabel: Record<string, number>;
}

export function buildRedactionPlan(
  sourceText: string,
  rejectedIds: ReadonlySet<string>,
  manualSpans: ReadonlyArray<{ id: string; start: number; end: number; value: string }>,
  style: "labelled" | "generic",
): RedactionPlan {
  const autoMatches = runDetectors(sourceText);

  const combined: DetectorMatch[] = [...autoMatches];
  for (const m of manualSpans) {
    if (m.start >= 0 && m.end > m.start && m.end <= sourceText.length) {
      combined.push({
        id: m.id,
        detectorId: "api_key_token",
        label: "Manual Selection",
        placeholderPrefix: "CUSTOM",
        start: m.start,
        end: m.end,
        value: sourceText.slice(m.start, m.end),
        accuracy: "exact",
      });
    }
  }

  combined.sort((a, b) => a.start - b.start);

  // Deduplicate overlaps prioritizing earlier start
  const deduped: DetectorMatch[] = [];
  let lastEnd = -1;
  for (const item of combined) {
    if (item.start >= lastEnd) {
      deduped.push(item);
      lastEnd = item.end;
    }
  }

  const valueToPlaceholder = new Map<string, string>();
  const prefixCounters = new Map<string, number>();
  let genericCounter = 0;

  const placeholderToOriginal = new Map<string, string>();
  const countsByLabel: Record<string, number> = {};

  const findings: RedactionFinding[] = deduped.map((match) => {
    const accepted = !rejectedIds.has(match.id);
    let placeholder = valueToPlaceholder.get(match.value);
    if (!placeholder) {
      if (style === "generic") {
        genericCounter++;
        placeholder = `[REDACTED_${genericCounter}]`;
      } else {
        const nextNum = (prefixCounters.get(match.placeholderPrefix) ?? 0) + 1;
        prefixCounters.set(match.placeholderPrefix, nextNum);
        placeholder = `[${match.placeholderPrefix}_${nextNum}]`;
      }
      valueToPlaceholder.set(match.value, placeholder);
    }

    if (accepted) {
      placeholderToOriginal.set(placeholder, match.value);
      countsByLabel[match.label] = (countsByLabel[match.label] ?? 0) + 1;
    }

    return {
      ...match,
      accepted,
      placeholder,
    };
  });

  // Construct masked text from accepted spans
  let maskedText = "";
  let cursor = 0;
  for (const f of findings) {
    if (!f.accepted) continue;
    maskedText += sourceText.slice(cursor, f.start);
    maskedText += f.placeholder;
    cursor = f.end;
  }
  maskedText += sourceText.slice(cursor);

  return {
    maskedText,
    findings,
    placeholderToOriginal,
    countsByLabel,
  };
}

export function restoreRedactedReply(
  replyText: string,
  placeholderToOriginal: ReadonlyMap<string, string>,
): { restoredText: string; restoredCount: number } {
  if (!replyText || placeholderToOriginal.size === 0) {
    return { restoredText: replyText, restoredCount: 0 };
  }

  let output = replyText;
  let restoredCount = 0;

  // Replace longest placeholders first to avoid partial prefix overlap
  const entries = Array.from(placeholderToOriginal.entries()).sort(
    (a, b) => b[0].length - a[0].length,
  );

  for (const [placeholder, original] of entries) {
    if (output.includes(placeholder)) {
      const parts = output.split(placeholder);
      restoredCount += parts.length - 1;
      output = parts.join(original);
    }
  }

  return { restoredText: output, restoredCount };
}

