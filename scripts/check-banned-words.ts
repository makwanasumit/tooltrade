import fs from "node:fs";
import path from "node:path";

const TARGET_FILES = [
  "src/lib/tools/registry.ts",
  "src/lib/content/guides.ts",
  "src/app/accuracy/page.tsx",
  "src/features/ai-prep/redactor/PiiRedactorTool.tsx",
  "src/features/ai-prep/hidden-text/HiddenTextScannerTool.tsx",
];

// Prohibited overclaim phrases from PRD v2 §6.4 / §7.3 / §7.5 / Appendix B
const PROHIBITED_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\banonymi[sz]ed\b/i, reason: "Banned wording: 'anonymised/anonymized'" },
  { pattern: /\bremove ai label\b/i, reason: "Banned wording: 'remove AI label'" },
  {
    pattern: /\b(guaranteed|100%|completely|fully)\s+(safe|secure|compliant)\b/i,
    reason: "Banned absolute safety/compliance claim",
  },
  {
    pattern: /\bthis (file|document|text) is safe\b/i,
    reason: "Banned 'safe' verdict phrasing",
  },
];

let failed = false;

for (const relPath of TARGET_FILES) {
  const fullPath = path.join(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) continue;
  const content = fs.readFileSync(fullPath, "utf8");
  const lines = content.split("\n");
  lines.forEach((line, idx) => {
    for (const rule of PROHIBITED_PATTERNS) {
      if (rule.pattern.test(line)) {
        console.error(`${relPath}:${idx + 1} -> ${rule.reason}\n  ${line.trim()}`);
        failed = true;
      }
    }
  });
}

if (failed) {
  process.exit(1);
}

console.log("Banned-wording check passed cleanly.");

