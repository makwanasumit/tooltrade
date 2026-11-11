import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GUIDES } from "@/lib/content/guides";
import { Breadcrumbs } from "@/components/tools/seo/Breadcrumbs";

export const metadata: Metadata = {
  title: "Guides & Trust Walkthroughs | Everyday Tools Hub",
  description:
    "Original, practical tutorials on verifying local browser processing, preparing data for LLMs, inspecting hidden PDF text, and date/image workflows.",
  alternates: { canonical: "/guides" },
};

export default function GuidesIndexPage() {
  return (
    <div className="padding-global pt-[calc(var(--nav-height)+2rem)] pb-24">
      <div className="container-editorial">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Guides" }]} />

        <div className="max-w-3xl mb-10">
          <p className="eyebrow-m mb-2">Documentation &amp; Guides</p>
          <h1 className="heading-xl text-[var(--theme-heading)]">Guides &amp; Walkthroughs</h1>
          <p className="mt-3 text-base sm:text-lg text-[var(--theme-text-muted)]">
            Clear explanations of how our local utilities work, how to verify zero uploads, and what
            automated detectors can and cannot catch.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {GUIDES.map((g) => (
            <Link
              key={g.slug}
              href={`/guides/${g.slug}`}
              className="rounded-3xl p-6 bg-[var(--theme-surface)] border border-[var(--theme-border)] hover:border-[var(--swatch-accent)] no-underline text-[var(--theme-text)] flex flex-col justify-between gap-4 transition-colors"
            >
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--swatch-accent)]">
                  {g.categoryLabel} • {g.readingMinutes} min read
                </span>
                <h2 className="text-xl font-bold mt-2 leading-snug">{g.title}</h2>
                <p className="mt-2 text-sm text-[var(--theme-text-muted)] leading-relaxed">
                  {g.summary}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--swatch-accent)]">
                Read guide <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

