import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/tools/seo/Breadcrumbs";

export const metadata: Metadata = {
  title: "About Everyday Tools Hub",
  description:
    "How Everyday Tools Hub works: client-side browser execution, audit-gated privacy badges, and transparent Exact vs. Estimated vs. Heuristic accuracy.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="padding-global pt-[calc(var(--nav-height)+2rem)] pb-24">
      <div className="container-editorial max-w-4xl space-y-8">
        <div>
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About" }]} />
          <h1 className="heading-xl text-[var(--theme-heading)]">About Everyday Tools Hub</h1>
          <p className="mt-3 text-base sm:text-lg text-[var(--theme-text-muted)] leading-relaxed">
            Everyday Tools Hub is a balanced, browser-local utility hub designed to complete everyday
            file, text, developer, QR, date, and AI preparation tasks cleanly without forcing users
            to create accounts or upload sensitive files.
          </p>
        </div>

        <div className="rounded-3xl bg-[var(--theme-surface)] border border-[var(--theme-border)] p-6 sm:p-10 space-y-6 text-sm sm:text-base text-[var(--theme-text-muted)] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[var(--theme-heading)]">
              Three Commitments We Enforce in Code
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Audit-gated local badges:</strong> A tool only renders a &ldquo;Runs on
                your device&rdquo; badge when a dated network-inspection audit record exists in our
                registry.
              </li>
              <li>
                <strong>Honest accuracy labels:</strong> Every tool declares whether outputs are{" "}
                <Link href="/accuracy" className="text-[var(--swatch-accent)] underline">
                  Exact, Estimated, or Heuristic
                </Link>{" "}
                with a plain-language explanation right beside the result.
              </li>
              <li>
                <strong>Reviewable edits:</strong> Tools that modify text or JSON expose every
                automatic change in a reversible diff panel before you copy or download.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[var(--theme-heading)]">What We Avoid</h2>
            <p>
              We do not collect pasted text, files, or findings in analytics; we do not ship
              unreliable AI-writing detectors; and we never promise guaranteed compliance or
              absolute safety verdicts.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

