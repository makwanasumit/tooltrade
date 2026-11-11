import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/tools/seo/Breadcrumbs";
import { AccuracyBadge } from "@/components/tools/badges/AccuracyBadge";
import { evaluateDetectorCorpus } from "@/lib/detectors/corpus";
import { DETECTOR_SET_VERSION } from "@/lib/detectors/registry";

export const metadata: Metadata = {
  title: "Accuracy Standards & Detector Test Corpus | Everyday Tools Hub",
  description:
    "How Everyday Tools Hub defines Exact, Estimated, and Heuristic results, plus live precision and recall numbers from our synthetic detector test corpus.",
  alternates: { canonical: "/accuracy" },
};

export default function AccuracyPage() {
  const report = evaluateDetectorCorpus();

  return (
    <div className="padding-global pt-[calc(var(--nav-height)+2rem)] pb-24">
      <div className="container-editorial max-w-5xl space-y-10">
        <div>
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Accuracy & Methodology" }]} />
          <p className="eyebrow-m mb-2">Provable Honesty</p>
          <h1 className="heading-xl text-[var(--theme-heading)]">Accuracy &amp; Test Corpora</h1>
          <p className="mt-3 text-base sm:text-lg text-[var(--theme-text-muted)] max-w-3xl leading-relaxed">
            Every result badge across Everyday Tools Hub comes from a single typed registry and
            reflects how the calculation actually works — never marketing optimism.
          </p>
        </div>

        {/* Badge Definitions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-3xl bg-[var(--theme-surface)] border border-[var(--theme-border)] p-6 space-y-3">
            <AccuracyBadge kind="exact" />
            <p className="text-sm text-[var(--theme-text-muted)] leading-relaxed">
              Deterministic calculations verified directly against math, checksums, RFC parsers,
              open BPE tables (<code>o200k_base</code> / <code>cl100k_base</code>), or generated file
              byte/dimension headers.
            </p>
          </div>

          <div className="rounded-3xl bg-[var(--theme-surface)] border border-[var(--theme-border)] p-6 space-y-3">
            <AccuracyBadge kind="estimated" />
            <p className="text-sm text-[var(--theme-text-muted)] leading-relaxed">
              Approximations where an exact proprietary specification (such as closed Anthropic or
              Google tokenizers) is not bundled client-side. Ranges show expected variance.
            </p>
          </div>

          <div className="rounded-3xl bg-[var(--theme-surface)] border border-[var(--theme-border)] p-6 space-y-3">
            <AccuracyBadge kind="heuristic" />
            <p className="text-sm text-[var(--theme-text-muted)] leading-relaxed">
              Pattern-based inference (such as PDF near-white fills, truncation detection, or
              optional prompt-instruction phrase flags) that can have false positives or bypasses.
            </p>
          </div>
        </div>

        {/* Live Synthetic Corpus Benchmark */}
        <section className="rounded-3xl bg-[var(--theme-surface)] border border-[var(--theme-border)] p-6 sm:p-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">
                Safe-to-Paste Redactor — Synthetic Corpus Benchmark
              </h2>
              <p className="text-xs sm:text-sm text-[var(--theme-text-muted)] mt-1">
                Detector set version <code className="font-mono">{DETECTOR_SET_VERSION}</code> •
                Computed directly from the shared production detector engine across{" "}
                {report.sampleCount} synthetic cases with decoys.
              </p>
            </div>
            <div className="flex gap-3 text-xs font-mono font-bold">
              <span className="px-3 py-1.5 rounded-full bg-[var(--status-verified-bg)] text-[var(--status-verified-fg)]">
                Precision: {(report.precision * 100).toFixed(1)}%
              </span>
              <span className="px-3 py-1.5 rounded-full bg-[var(--status-exact-bg)] text-[var(--status-exact-fg)]">
                Recall: {(report.recall * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[var(--theme-border)]">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[var(--theme-surface-muted)]/70">
                <tr>
                  <th className="py-3 px-4 font-semibold">Detector ID</th>
                  <th className="py-3 px-4 font-semibold">True Positives</th>
                  <th className="py-3 px-4 font-semibold">False Positives</th>
                  <th className="py-3 px-4 font-semibold">False Negatives</th>
                  <th className="py-3 px-4 font-semibold">Precision</th>
                  <th className="py-3 px-4 font-semibold">Recall</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--theme-border)]">
                {report.byDetector.map((row) => (
                  <tr key={row.detectorId}>
                    <td className="py-3 px-4 font-mono font-semibold">{row.detectorId}</td>
                    <td className="py-3 px-4 font-mono">{row.tp}</td>
                    <td className="py-3 px-4 font-mono">{row.fp}</td>
                    <td className="py-3 px-4 font-mono">{row.fn}</td>
                    <td className="py-3 px-4 font-mono">{(row.precision * 100).toFixed(1)}%</td>
                    <td className="py-3 px-4 font-mono">{(row.recall * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-[var(--theme-text-muted)]">
            Note: Synthetic benchmark scores measure known pattern rules (email, Luhn cards, mod-97
            IBANs, API prefixes, IPs, SSN/PAN, phones). Unstructured human names and street addresses
            are intentionally omitted from automated claims until an audited on-device NER gate
            passes.
          </p>
        </section>

        {/* Explicit Non-Build Commitment */}
        <section className="rounded-3xl bg-[var(--theme-surface-muted)]/55 border border-[var(--theme-border)] p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-bold">Why We Deliberately Do Not Build an AI-Text Detector</h2>
          <p className="text-sm text-[var(--theme-text-muted)] leading-relaxed">
            Published studies demonstrate high false-positive rates against non-native English
            writers on automated &ldquo;AI text detectors.&rdquo; Because accuracy cannot be
            defended responsibly and false accusations cause real harm to students and applicants, we
            will not ship an AI-writing detector.
          </p>
          <p className="text-xs">
            <Link href="/guides/verify-local-processing" className="text-[var(--swatch-accent)] font-semibold">
              Read how we verify zero server uploads →
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}

