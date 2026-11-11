import type { PiiDetectorId } from "./registry";
import { runDetectors } from "./runner";

export interface CorpusSample {
  id: string;
  description: string;
  text: string;
  expected: Array<{ detectorId: PiiDetectorId; value: string }>;
}

export const SYNTHETIC_DETECTOR_CORPUS: readonly CorpusSample[] = [
  {
    id: "corp-01",
    description: "Work email & E.164 phone inside prose",
    text: "Reach Priya Nair at priya.nair@acme-ops.example or +1-415-555-0192 before Friday.",
    expected: [
      { detectorId: "email", value: "priya.nair@acme-ops.example" },
      { detectorId: "phone", value: "+1-415-555-0192" },
    ],
  },
  {
    id: "corp-02",
    description: "Valid Luhn test card vs non-Luhn decoy order number",
    text: "Card 4532 0151 1283 0366 failed, reference order 4532015112830367.",
    expected: [{ detectorId: "credit_card", value: "4532 0151 1283 0366" }],
  },
  {
    id: "corp-03",
    description: "Valid German IBAN vs malformed IBAN decoy",
    text: "Wire to DE89 3704 0044 0532 0130 00 (ignore invalid DE00 3704 0044 0532 0130 00).",
    expected: [{ detectorId: "iban", value: "DE89 3704 0044 0532 0130 00" }],
  },
  {
    id: "corp-04",
    description: "API tokens, JWT, and credential URL",
    text: "Deploy key demo_api_key_ABCDEFGHIJKLMNOPQRSTUVWXYZ123456, URL https://admin:s3cr3t@db.internal.example/dump?token=abc, JWT eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.sig12345678",
    expected: [
      { detectorId: "api_key_token", value: "demo_api_key_ABCDEFGHIJKLMNOPQRSTUVWXYZ123456" },
      { detectorId: "credential_url", value: "https://admin:s3cr3t@db.internal.example/dump?token=abc" },
      { detectorId: "api_key_token", value: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.sig12345678" },
    ],
  },
  {
    id: "corp-05",
    description: "IPv4 vs software semantic version decoy",
    text: "Server 192.168.14.22 running build v2.4.18.900.",
    expected: [{ detectorId: "ipv4", value: "192.168.14.22" }],
  },
  {
    id: "corp-06",
    description: "US SSN & India PAN formats vs invalid 000 SSN decoy",
    text: "Tax ID ABCPA1234F, SSN 123-45-6789 (not 000-12-3456).",
    expected: [
      { detectorId: "in_pan", value: "ABCPA1234F" },
      { detectorId: "us_ssn", value: "123-45-6789" },
    ],
  },
];

export interface CorpusMetricsReport {
  sampleCount: number;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  byDetector: Array<{
    detectorId: string;
    tp: number;
    fp: number;
    fn: number;
    precision: number;
    recall: number;
  }>;
}

export function evaluateDetectorCorpus(): CorpusMetricsReport {
  let tp = 0;
  let fp = 0;
  let fn = 0;

  const perDetector = new Map<string, { tp: number; fp: number; fn: number }>();
  const ensure = (id: string) => {
    if (!perDetector.has(id)) perDetector.set(id, { tp: 0, fp: 0, fn: 0 });
    return perDetector.get(id)!;
  };

  for (const sample of SYNTHETIC_DETECTOR_CORPUS) {
    const actual = runDetectors(sample.text);
    const expectedUsed = new Set<number>();

    for (const hit of actual) {
      const stat = ensure(hit.detectorId);
      const matchIdx = sample.expected.findIndex(
        (exp, idx) =>
          !expectedUsed.has(idx) && exp.detectorId === hit.detectorId && exp.value === hit.value,
      );
      if (matchIdx >= 0) {
        expectedUsed.add(matchIdx);
        tp++;
        stat.tp++;
      } else {
        fp++;
        stat.fp++;
      }
    }

    sample.expected.forEach((exp, idx) => {
      if (!expectedUsed.has(idx)) {
        fn++;
        ensure(exp.detectorId).fn++;
      }
    });
  }

  const precision = tp + fp === 0 ? 1 : Number((tp / (tp + fp)).toFixed(4));
  const recall = tp + fn === 0 ? 1 : Number((tp / (tp + fn)).toFixed(4));

  const byDetector = Array.from(perDetector.entries()).map(([detectorId, s]) => ({
    detectorId,
    tp: s.tp,
    fp: s.fp,
    fn: s.fn,
    precision: s.tp + s.fp === 0 ? 1 : Number((s.tp / (s.tp + s.fp)).toFixed(4)),
    recall: s.tp + s.fn === 0 ? 1 : Number((s.tp / (s.tp + s.fn)).toFixed(4)),
  }));

  return {
    sampleCount: SYNTHETIC_DETECTOR_CORPUS.length,
    truePositives: tp,
    falsePositives: fp,
    falseNegatives: fn,
    precision,
    recall,
    byDetector,
  };
}
