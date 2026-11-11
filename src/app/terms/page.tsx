import React from "react";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/tools/seo/Breadcrumbs";

export const metadata: Metadata = {
  title: "Terms of Use | Everyday Tools Hub",
  description: "Terms and honest liability boundaries for using Everyday Tools Hub browser utilities.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="padding-global pt-[calc(var(--nav-height)+2rem)] pb-24">
      <div className="container-editorial max-w-4xl space-y-6">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Terms of Use" }]} />
        <h1 className="heading-l text-[var(--theme-heading)]">Terms of Use</h1>
        <div className="rounded-3xl bg-[var(--theme-surface)] border border-[var(--theme-border)] p-6 sm:p-10 space-y-5 text-sm sm:text-base text-[var(--theme-text-muted)] leading-relaxed">
          <p>
            Everyday Tools Hub provides free client-side utility tools on an &ldquo;as is&rdquo;
            basis. Always keep backups of original documents before compressing, merging,
            splitting, or redacting data.
          </p>
          <p>
            Pattern-based scanners (including Safe-to-Paste Redactor and Hidden Text Scanner) detect
            known patterns and cannot guarantee total absence of sensitive information or hidden
            concealment techniques. Review outputs before sharing with external services.
          </p>
          <p>
            Nothing on this website constitutes legal, compliance, or security-audit advice.
          </p>
        </div>
      </div>
    </div>
  );
}

