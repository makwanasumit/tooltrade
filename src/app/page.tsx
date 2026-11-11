import React from "react";
import type { Metadata } from "next";
import { HeroSection } from "@/components/home/HeroSection";
import { IntroCollageSection } from "@/components/home/IntroCollageSection";
import { FeaturedStackSection } from "@/components/home/FeaturedStackSection";
import { CategoryShowcaseSection } from "@/components/home/CategoryShowcaseSection";
import { TrustGridSection } from "@/components/home/TrustGridSection";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { GUIDES } from "@/lib/content/guides";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Everyday Tools Hub — Local Browser Utilities & AI Prep Tools",
  description:
    "Compress images, merge PDFs, count words, format JSON, generate QR codes, redact PII before AI chat, and repair broken LLM JSON locally in your browser.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <IntroCollageSection />
      <FeaturedStackSection />
      <CategoryShowcaseSection />
      <TrustGridSection />

      {/* Practical Trust & Workflow Guides Preview */}
      <section className="padding-global py-20 md:py-24 border-t-[1.5px] border-[var(--swatch-ink)]">
        <div className="container-editorial">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="eyebrow-m mb-2">Reviewed Guides</p>
              <ScrollReveal mode="chars">
                <h2 className="heading-l text-[var(--theme-heading)]">Practical Walkthroughs</h2>
              </ScrollReveal>
            </div>
            <TransitionLink
              href="/guides"
              className="text-sm font-semibold text-[var(--swatch-accent)] no-underline hover:underline inline-flex items-center gap-1"
            >
              <span>All guides</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </TransitionLink>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {GUIDES.slice(0, 3).map((guide) => (
              <TransitionLink
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                className="tool-next no-underline text-[var(--theme-text)] flex flex-col justify-between gap-4"
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--swatch-accent)]">
                    {guide.categoryLabel} • {guide.readingMinutes} min read
                  </span>
                  <h3 className="text-lg font-bold mt-2 leading-snug">{guide.title}</h3>
                  <p className="mt-2 text-sm text-[var(--theme-text-muted)] leading-relaxed">
                    {guide.summary}
                  </p>
                </div>
                <span className="text-xs font-semibold text-[var(--swatch-accent)] inline-flex items-center gap-1">
                  Read guide <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
              </TransitionLink>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

