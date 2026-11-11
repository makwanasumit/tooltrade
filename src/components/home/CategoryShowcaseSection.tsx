"use client";

import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { CATEGORIES, getToolsByCategory } from "@/lib/tools/registry";

export function CategoryShowcaseSection() {
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  return (
    <section className="section_services padding-global py-20 md:py-28">
      <div className="container-editorial">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <p className="eyebrow-m mb-3">7 Focused Categories</p>
            <ScrollReveal mode="chars">
              <h2 className="heading-xl text-[var(--theme-heading)]">
                Pick a task family.
              </h2>
            </ScrollReveal>
          </div>
          <p className="text-base text-[var(--theme-text-muted)] max-w-md">
            Each category opens straight into working browser utilities — zero paywalls, zero
            mandatory sign-ups.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {CATEGORIES.map((cat) => {
            const count = getToolsByCategory(cat.slug).length;
            const isHovered = hoveredSlug === cat.slug;
            return (
              <div
                key={cat.slug}
                className="services-cards_item transition-transform duration-300"
                onMouseEnter={() => setHoveredSlug(cat.slug)}
                onMouseLeave={() => setHoveredSlug(null)}
              >
                <TransitionLink
                  href={`/categories/${cat.slug}`}
                  data-cursor-marquee-text="Explore category →"
                  className={`block h-full rounded-[var(--radius-lg)] p-7 border-[1.5px] border-[var(--swatch-ink)] no-underline shadow-[4px_4px_0_var(--swatch-ink)] hover:shadow-[8px_8px_0_var(--swatch-ink)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-300 ${cat.themeVariant}`}
                >
                  <div className="flex items-center justify-between gap-3 mb-6">
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-white/80 text-[var(--swatch-ink)]">
                      {count} {count === 1 ? "Tool" : "Tools"}
                    </span>
                    <span
                      className={`w-9 h-9 rounded-full bg-white/80 text-[var(--swatch-ink)] inline-flex items-center justify-center transition-transform duration-300 ${
                        isHovered ? "translate-x-1 -translate-y-0.5 scale-105" : ""
                      }`}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>

                  <h3 className="heading-s">{cat.name}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed opacity-90">{cat.tagline}</p>

                  {/* Micro interactive state bar on hover (replaces heavy HLS video previews) */}
                  <div className="mt-6 pt-4 border-t-[1.5px] border-black/70 flex items-center justify-between text-xs font-semibold">
                    <span>Local Browser Processing</span>
                    <span className="font-mono">
                      {isHovered ? "Ready →" : "Open"}
                    </span>
                  </div>
                </TransitionLink>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

