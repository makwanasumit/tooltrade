"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { Button052 } from "@/components/ui/Button052";
import { useMotion } from "@/components/motion/MotionProvider";
import { CheckCircle2, FileSearch, ShieldAlert } from "lucide-react";

const COLLAGE_CARDS = [
  {
    id: "collage-1",
    badge: "1. Verified Local",
    title: "Zero Upload Proof",
    detail: "Every tool badge is gated behind a dated DevTools network audit record.",
    bg: "#EEE9FF",
    border: "#C9B8FF",
    icon: CheckCircle2,
    iconColor: "#5B2BFF",
    layoutClass: "md:col-span-7 md:row-span-2 z-10",
  },
  {
    id: "collage-2",
    badge: "2. What Changed Diff",
    title: "Undo Every Edit",
    detail: "JSON repairs & PII masks expose before/after rules so nothing breaks silently.",
    bg: "#FFEFE9",
    border: "#FFC2B2",
    icon: FileSearch,
    iconColor: "#FF4D2E",
    layoutClass: "md:col-span-5 z-20 md:-ml-6 md:mt-6",
  },
  {
    id: "collage-3",
    badge: "3. Honest Limits",
    title: "Exact vs. Heuristic",
    detail: "We never show a false 'safe' green tick when a scanner cannot prove absence.",
    bg: "#F7FCD9",
    border: "#D6E86A",
    icon: ShieldAlert,
    iconColor: "#9A5608",
    layoutClass: "md:col-span-6 md:col-start-6 z-30 md:-mt-4",
  },
] as const;

export function IntroCollageSection() {
  const listRef = useRef<HTMLDivElement>(null);
  const { isDesktopFinePointer, reducedMotion } = useMotion();

  const handleEnter = (activeIdx: number) => {
    const list = listRef.current;
    if (!list || !isDesktopFinePointer || reducedMotion) return;
    const items = Array.from(list.querySelectorAll<HTMLElement>("[data-interactive-collage-item]"));

    items.forEach((el, idx) => {
      if (idx === activeIdx) {
        gsap.to(el, {
          scale: 1.05,
          xPercent: 0,
          yPercent: -2,
          rotation: 0,
          duration: 0.45,
          ease: "power2.out",
          overwrite: true,
        });
      } else {
        const dir = idx < activeIdx ? -1 : 1;
        gsap.to(el, {
          scale: 0.94,
          xPercent: dir * 3,
          yPercent: dir * 2,
          rotation: dir * 4,
          duration: 0.45,
          ease: "power2.out",
          overwrite: true,
        });
      }
    });
  };

  const handleLeaveAll = () => {
    const list = listRef.current;
    if (!list || !isDesktopFinePointer || reducedMotion) return;
    const items = Array.from(list.querySelectorAll<HTMLElement>("[data-interactive-collage-item]"));
    gsap.to(items, {
      scale: 1,
      xPercent: 0,
      yPercent: 0,
      rotation: 0,
      duration: 0.5,
      ease: "power3.out",
      overwrite: true,
    });
  };

  return (
    <section className="section_intro padding-global py-20 md:py-28">
      <div className="container-editorial grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Copy */}
        <div className="lg:col-span-5">
          <ScrollReveal mode="element">
            <p className="eyebrow-m mb-3">Why We Built This</p>
            <h2 className="heading-l text-[var(--theme-heading)]">
              Provable trust beats marketing slogans.
            </h2>
            <p className="mt-5 text-base sm:text-lg text-[var(--theme-text-muted)] leading-relaxed">
              Most free tool sites either upload your sensitive PDFs to mystery servers or guess
              results silently. We keep processing inside your browser and tell you plainly which
              numbers are Exact, Estimated, or Heuristic.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button052 href="/guides/verify-local-processing">
                Verify Zero Uploads Yourself
              </Button052>
            </div>
          </ScrollReveal>
        </div>

        {/* Right Interactive Collage */}
        <div className="lg:col-span-7" data-interactive-collage-init="">
          <div
            ref={listRef}
            data-interactive-collage-list=""
            onMouseLeave={handleLeaveAll}
            className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-3"
          >
            {COLLAGE_CARDS.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.id}
                  data-interactive-collage-item=""
                  onMouseEnter={() => handleEnter(idx)}
                  className={`rounded-[var(--radius-xl)] p-6 border-[1.5px] shadow-[4px_4px_0_var(--swatch-ink)] transition-shadow hover:shadow-[8px_8px_0_var(--swatch-ink)] cursor-default ${card.layoutClass}`}
                  style={{
                    backgroundColor: card.bg,
                    borderColor: "#0F0F0F",
                    color: "#0F0F0F",
                  }}
                >
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/80">
                      {card.badge}
                    </span>
                    <Icon className="w-5 h-5 shrink-0" style={{ color: card.iconColor }} />
                  </div>
                  <h3 className="text-xl font-bold">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed opacity-85">{card.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

