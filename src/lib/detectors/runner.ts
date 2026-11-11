import { PII_DETECTORS, type DetectorMatch, type PiiDetectorId } from "./registry";

export function runDetectors(
  text: string,
  enabledIds?: ReadonlySet<PiiDetectorId>,
): DetectorMatch[] {
  if (!text) return [];
  const rawMatches: DetectorMatch[] = [];

  for (const detector of PII_DETECTORS) {
    if (enabledIds && !enabledIds.has(detector.id)) continue;
    const regex = new RegExp(detector.pattern.source, detector.pattern.flags);
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      const val = m[0];
      if (!val) {
        regex.lastIndex++;
        continue;
      }
      if (detector.validate && !detector.validate(val)) continue;
      rawMatches.push({
        id: `${detector.id}:${m.index}:${m.index + val.length}`,
        detectorId: detector.id,
        label: detector.label,
        placeholderPrefix: detector.placeholderPrefix,
        start: m.index,
        end: m.index + val.length,
        value: val,
        accuracy: detector.accuracy,
      });
    }
  }

  // Sort by earliest start, then longest span; remove overlapping lower-priority matches
  rawMatches.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));

  const nonOverlapping: DetectorMatch[] = [];
  let cursor = -1;
  for (const match of rawMatches) {
    if (match.start >= cursor) {
      nonOverlapping.push(match);
      cursor = match.end;
    }
  }

  return nonOverlapping;
}

