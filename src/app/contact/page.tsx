import React from "react";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/tools/seo/Breadcrumbs";

export const metadata: Metadata = {
  title: "Contact | Everyday Tools Hub",
  description: "How to reach the Everyday Tools Hub maintainers for bug reports, privacy questions, or accessibility feedback.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="padding-global pt-[calc(var(--nav-height)+2rem)] pb-24">
      <div className="container-editorial max-w-3xl space-y-6">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
        <h1 className="heading-l text-[var(--theme-heading)]">Contact &amp; Feedback</h1>
        <div className="rounded-3xl bg-[var(--theme-surface)] border border-[var(--theme-border)] p-6 sm:p-8 space-y-4 text-sm sm:text-base text-[var(--theme-text-muted)] leading-relaxed">
          <p>
            Notice a file edge case, an accessibility barrier, a stale model pricing row, or a
            privacy question? Please reach out with the tool URL, browser version, and steps to
            reproduce. Do not send sensitive files or secrets when reporting an issue.
          </p>
          <p className="font-mono text-sm text-[var(--theme-text)] bg-[var(--theme-surface-muted)]/60 rounded-xl px-4 py-3">
            Privacy &amp; Support Email: support@everyday-tools.example
          </p>
        </div>
      </div>
    </div>
  );
}

