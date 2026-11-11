"use client";

import React, { useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Search, ShieldCheck, ArrowRight, Sparkles, Lock, FileCode2, Image as ImageIcon } from "lucide-react";
import { TextReveal } from "@/components/motion/TextReveal";
import { VariableWeightText } from "@/components/motion/VariableWeightText";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { Button052 } from "@/components/ui/Button052";
import { useMotion } from "@/components/motion/MotionProvider";
import { CATEGORIES, TOOLS_REGISTRY } from "@/lib/tools/registry";
import { TrustMarquee } from "./TrustMarquee";

const HERO_PREVIEW_CARDS = [
  {
    id: "card-compress",
    title: "Image Compressor",
    metric: "-74% size",
    detail: "2.4 MB → 618 KB WebP",
    bg: "#FFB199",
    fg: "#0F0F0F",
    icon: ImageIcon,
    href: "/tools/image-compressor",
  },
  {
    id: "card-redact",
    title: "Safe-to-Paste Redactor",
    metric: "4 patterns masked",
    detail: "sk_live_••• → [API_KEY_1]",
    bg: "#BCD4FF",
    fg: "#0F0F0F",
    icon: Lock,
    href: "/tools/pii-redactor",
  },
  {
    id: "card-json",
    title: "LLM JSON Repair",
    metric: "3 syntax fixes",
    detail: "Closed fence + trailing comma",
    bg: "#E6F78A",
    fg: "#0F0F0F",
    icon: FileCode2,
    href: "/tools/llm-json-repair",
  },
  {
    id: "card-token",
    title: "Token & Context Calc",
    metric: "Exact • 18,420 tok",
    detail: "14% of 128k context",
    bg: "#A8ECD0",
    fg: "#0F0F0F",
    icon: Sparkles,
    href: "/tools/token-counter",
  },
] as const;

export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const { isDesktopFinePointer, reducedMotion } = useMotion();

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return TOOLS_REGISTRY.filter(
      (tool) =>
        tool.status === "published" &&
        (tool.name.toLowerCase().includes(q) ||
          tool.shortDescription.toLowerCase().includes(q) ||
          tool.keywords.some((kw) => kw.includes(q))),
    ).slice(0, 6);
  }, [query]);

  // Extrafazant Hero Cursor Cards (300px movement threshold + ±8deg tilt)
  useGSAP(
    () => {
      const hero = heroRef.current;
      const cardContainer = cardsContainerRef.current;
      if (!hero || !cardContainer || !isDesktopFinePointer || reducedMotion) return;

      const cardEls = Array.from(cardContainer.querySelectorAll<HTMLElement>("[data-cursor-cards-media]"));
      if (cardEls.length === 0) return;

      let lastSwitchX = 0;
      let lastSwitchY = 0;
      let currentIdx = 0;
      const threshold = 260;

      const xTo = gsap.quickTo(cardContainer, "x", { duration: 0.45, ease: "power2.out" });
      const yTo = gsap.quickTo(cardContainer, "y", { duration: 0.45, ease: "power2.out" });
      const rotTo = gsap.quickTo(cardContainer, "rotation", { duration: 0.45, ease: "power2.out" });

      gsap.set(cardEls[0]!, { autoAlpha: 1 });

      const onMove = (e: PointerEvent) => {
        const rect = hero.getBoundingClientRect();
        const relX = e.clientX - rect.left;
        const relY = e.clientY - rect.top;

        // Avoid obscuring search bar interactions when pointer is directly inside form controls
        const normX = (relX / rect.width - 0.5) * 2;
        const clampedRot = Math.max(-8, Math.min(8, normX * 8));

        xTo(relX - rect.width * 0.72);
        yTo(relY - rect.height * 0.42);
        rotTo(clampedRot);

        const dist = Math.hypot(relX - lastSwitchX, relY - lastSwitchY);
        if (dist > threshold) {
          lastSwitchX = relX;
          lastSwitchY = relY;
          const prevEl = cardEls[currentIdx];
          currentIdx = (currentIdx + 1) % cardEls.length;
          const nextEl = cardEls[currentIdx];
          setActiveCardIdx(currentIdx);

          if (prevEl) {
            gsap.to(prevEl, { autoAlpha: 0, duration: 0.25, ease: "power2.out", overwrite: true });
          }
          if (nextEl) {
            gsap.fromTo(
              nextEl,
              { autoAlpha: 0, scale: 0.92 },
              { autoAlpha: 1, scale: 1, duration: 0.35, ease: "power2.out", overwrite: true },
            );
          }
        }
      };

      hero.addEventListener("pointermove", onMove, { passive: true });
      return () => hero.removeEventListener("pointermove", onMove);
    },
    { scope: heroRef, dependencies: [isDesktopFinePointer, reducedMotion] },
  );

  return (
    <header
      ref={heroRef}
      data-cursor-cards=""
      data-cursor-cards-threshold="260"
      className="section_hero relative overflow-hidden pt-[calc(var(--nav-height)+3.5rem)] pb-0 border-b-[1.5px] border-[var(--swatch-ink)]"
    >
      <div className="padding-global relative z-10 pb-14 md:pb-20">
        <div className="container-editorial relative">
          {/* Desktop Cursor-Following Tool Preview Cards */}
          <div
            ref={cardsContainerRef}
            data-cursor-cards-medias=""
            className="hidden lg:block pointer-events-none absolute top-10 right-6 w-72 h-44 z-0"
            aria-hidden="true"
          >
            {HERO_PREVIEW_CARDS.map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.id}
                  data-cursor-cards-media=""
                  className={`cursor-card_media absolute inset-0 rounded-[var(--radius-lg)] p-5 border-[1.5px] border-[var(--swatch-ink)] shadow-[5px_5px_0_var(--swatch-ink)] flex flex-col justify-between ${
                    i === activeCardIdx ? "on" : ""
                  }`}
                  style={{ backgroundColor: card.bg, color: card.fg }}
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider opacity-80">
                      <Icon className="w-3.5 h-3.5" />
                      Live Preview
                    </span>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-white/70">
                      {card.metric}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-lg leading-tight">{card.title}</p>
                    <p className="text-xs font-mono opacity-80 mt-1">{card.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Editorial Eyebrow + Monumental Variable Headline */}
          <div className="relative z-10 mx-auto max-w-5xl text-center">
            <TextReveal mode="lines" as="div" className="eyebrow-l mb-6 flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--swatch-volt)] border-[1.5px] border-[var(--swatch-ink)] text-[var(--swatch-ink)] text-xs sm:text-sm font-bold">
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                100% Browser-Local • No Accounts
              </span>
              <span className="text-sm text-[var(--theme-text-muted)]">
                12 Everyday Utilities + 4 AI Prep Tools
              </span>
            </TextReveal>

            <TextReveal mode="chars" as="h1" className="heading-xxl text-[var(--theme-heading)]">
              <VariableWeightText weightRest={800} weightNear={300} radius={420}>
                Useful tools,
              </VariableWeightText>
              <br />
              <VariableWeightText
                weightRest={300}
                weightNear={800}
                radius={400}
                className="heading-alt text-[var(--swatch-accent)]"
              >
                ready right here.
              </VariableWeightText>
            </TextReveal>

            <TextReveal
              mode="lines"
              delay={0.15}
              as="p"
              className="mt-7 mx-auto text-base sm:text-xl text-[var(--theme-text-muted)] max-w-2xl leading-relaxed"
            >
              Compress photos, merge PDFs, format JSON, or redact sensitive details and repair broken
              LLM output — executed on your device with honest accuracy labels.
            </TextReveal>

            {/* Instant Above-the-Fold Tool Search (PRD Task-First Principle) */}
            <div className="mt-9 mx-auto max-w-2xl relative z-20 text-left">
              <label htmlFor="hero-tool-search" className="sr-only">
                Search for a tool by task or format
              </label>
              <div className="relative flex items-center">
                <Search
                  className="w-5 h-5 text-[var(--theme-text-muted)] absolute left-4 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="hero-tool-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Jump to a tool: compress JPG, merge PDF, redact PII, fix JSON..."
                  className="tool-input !rounded-full pl-12 pr-5 py-4 text-base"
                />
              </div>

              {query.trim().length > 0 && (
                <div
                  role="region"
                  aria-label="Matching tools"
                  className="mt-3 rounded-[var(--radius-lg)] bg-[var(--theme-surface)] border-[1.5px] border-[var(--swatch-ink)] shadow-[5px_5px_0_var(--swatch-ink)] p-2 divide-y divide-[var(--theme-border)]"
                >
                  {searchResults.length > 0 ? (
                    searchResults.map((tool) => (
                      <TransitionLink
                        key={tool.id}
                        href={`/tools/${tool.slug}`}
                        className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl hover:bg-[var(--theme-surface-muted)] no-underline text-[var(--theme-text)] transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-sm">{tool.name}</p>
                          <p className="text-xs text-[var(--theme-text-muted)] line-clamp-1">
                            {tool.shortDescription}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 shrink-0 text-[var(--swatch-accent)]" />
                      </TransitionLink>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-[var(--theme-text-muted)]">
                      No matching tools for &ldquo;{query}&rdquo;.{" "}
                      <TransitionLink href="/tools" className="text-[var(--swatch-accent)] font-semibold">
                        Browse all 16 tools →
                      </TransitionLink>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Category Pills + Primary CTA */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
                <Button052 href="/tools">Open Tool Directory</Button052>
                {CATEGORIES.slice(0, 4).map((cat) => (
                  <TransitionLink
                    key={cat.slug}
                    href={`/categories/${cat.slug}`}
                    className="tool-chip no-underline"
                  >
                    {cat.shortName}
                  </TransitionLink>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile/Tablet fallback cards strip (design doc §14 responsive rule) */}
          <div className="lg:hidden mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {HERO_PREVIEW_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <TransitionLink
                  key={card.id}
                  href={card.href}
                  className="rounded-[var(--radius-lg)] p-4 border-[1.5px] border-[var(--swatch-ink)] shadow-[3px_3px_0_var(--swatch-ink)] no-underline flex flex-col justify-between gap-3"
                  style={{ backgroundColor: card.bg, color: card.fg }}
                >
                  <div className="flex items-center justify-between">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-white/75">
                      {card.metric}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-sm">{card.title}</p>
                    <p className="text-xs font-mono opacity-80">{card.detail}</p>
                  </div>
                </TransitionLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* Infinite Scroll-Direction-Reactive Trust Marquee */}
      <TrustMarquee />
    </header>
  );
}

