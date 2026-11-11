import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/tools/seo/Breadcrumbs";

export const metadata: Metadata = {
  title: "Privacy Policy | Everyday Tools Hub",
  description:
    "How Everyday Tools Hub handles local browser processing, zero content collection, memory-only redaction mappings, and future optional consent controls.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="padding-global pt-[calc(var(--nav-height)+2rem)] pb-24">
      <div className="container-editorial max-w-4xl space-y-8">
        <div>
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]} />
          <h1 className="heading-l text-[var(--theme-heading)]">Privacy Policy</h1>
          <p className="mt-2 text-xs font-mono text-[var(--theme-text-muted)]">
            Last updated: 2026-11-11
          </p>
        </div>

        <div className="rounded-3xl bg-[var(--theme-surface)] border border-[var(--theme-border)] p-6 sm:p-10 space-y-6 text-sm sm:text-base text-[var(--theme-text-muted)] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[var(--theme-heading)]">
              1. Local File &amp; Text Processing
            </h2>
            <p>
              All 16 tools currently published on Everyday Tools Hub run directly in your browser.
              Uploaded images, PDFs, DOCX/HTML files, pasted text, JSON payloads, QR inputs, and
              redaction mappings are processed in browser memory and Web Workers without transmitting
              inputs to our servers. You can inspect this behavior directly using our{" "}
              <Link href="/guides/verify-local-processing" className="text-[var(--swatch-accent)] underline">
                Verify Local Processing guide
              </Link>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[var(--theme-heading)]">
              2. No Content in Storage or Analytics
            </h2>
            <p>
              We never persist tool inputs, file names, QR payloads, GPS fields, or redaction
              mappings in databases, server logs, URL parameters, cookies, or localStorage. The
              Safe-to-Paste Redactor restore map is scrubbed on reset, navigation, and tab close.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[var(--theme-heading)]">
              3. Aggregate Telemetry &amp; Advertising Disclosures
            </h2>
            <p>
              Aggregate interaction counters (such as tool starts, completions, and error codes)
              exclude all user content. Advertising slots remain disabled until policy review and
              applicable consent controls are active; any vendor list will be updated here before
              enabling third-party scripts.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

