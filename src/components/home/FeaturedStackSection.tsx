"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { useMotion } from "@/components/motion/MotionProvider";
import { ArrowUpRight } from "lucide-react";

const FEATURED_WORKFLOWS = [
  {
    id: "stack-redactor",
    slug: "/tools/pii-redactor",
    eyebrow: "AI Prep • Wave 1",
    title: "Safe-to-Paste Redactor",
    description:
      "Detect emails, phones, Luhn cards, IBANs, and API keys locally before pasting into chatbots — then swap originals back in memory.",
    badge: "Exact Checksums + Memory-Only Restore",
    bg: "#BCD4FF",
    ink: "#0F0F0F",
  },
  {
    id: "stack-json-repair",
    slug: "/tools/llm-json-repair",
    eyebrow: "AI Prep • Wave 1",
    title: "LLM JSON Repair & Schema Check",
    description:
      "Strip markdown fences, close truncated brackets, inspect every single syntax edit with undo, and check draft 2020-12 schemas.",
    badge: "Undoable Diff + Fix Prompt",
    bg: "#E6F78A",
    ink: "#0F0F0F",
  },
  {
    id: "stack-pdf-merge",
    slug: "/tools/merge-pdf",
    eyebrow: "Document Studio • Wave 0",
    title: "Merge & Split PDF Locally",
    description:
      "Reorder pages with drag or keyboard, drop hidden author metadata, or extract exact ranges into a deterministic ZIP — zero uploads.",
    badge: "Web Worker • 0 KB Uploaded",
    bg: "#A8ECD0",
    ink: "#0F0F0F",
  },
  {
    id: "stack-image-compress",
    slug: "/tools/image-compressor",
    eyebrow: "Image Studio • Wave 0",
    title: "Image Compressor & KB Targeter",
    description:
      "Shrink JPEG, PNG, and WebP photos with side-by-side preview, lossless metadata stripping, and batch ZIP downloads.",
    badge: "Off-Thread Worker + Batch ZIP",
    bg: "#FFB199",
    ink: "#0F0F0F",
  },
] as const;

export function FeaturedStackSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const { reducedMotion } = useMotion();

  useGSAP(
    () => {
      const section = sectionRef.current;
      const pinEl = pinRef.current;
      const badgeEl = badgeRef.current;
      if (!section || !pinEl || reducedMotion) return;

      const mm = gsap.matchMedia();

      mm.add("(min-width: 992px)", () => {
        const slides = Array.from(pinEl.querySelectorAll<HTMLElement>("[data-featured-stack-slide]"));
        if (slides.length < 2) return;

        const gap = 36;
        slides.forEach((slide, index) => {
          gsap.set(slide, {
            z: -index * gap,
            y: index * 18,
            scale: 1 - index * 0.045,
            zIndex: slides.length - index,
            autoAlpha: 1,
            transformOrigin: "center center",
          });
        });

        const tl = gsap.timeline({ paused: true });

        for (let i = 0; i < slides.length - 1; i++) {
          const current = slides[i]!;
          // Animate active front card flying up & away, while remaining cards step forward
          tl.to(
            current,
            {
              yPercent: -115,
              rotationX: 12,
              autoAlpha: 0,
              duration: 1,
              ease: "power2.inOut",
            },
            i,
          );

          for (let j = i + 1; j < slides.length; j++) {
            const behind = slides[j]!;
            const offset = j - (i + 1);
            tl.to(
              behind,
              {
                z: -offset * gap,
                y: offset * 18,
                scale: 1 - offset * 0.045,
                duration: 1,
                ease: "power2.inOut",
              },
              i,
            );
          }
        }

        const st = ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: () => `+=${window.innerHeight * 0.85 * (slides.length - 1)}`,
          pin: pinEl,
          pinSpacing: true,
          scrub: 0.3,
          refreshPriority: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            tl.progress(self.progress);
            if (badgeEl) {
              gsap.set(badgeEl, { rotation: self.progress * 180 });
            }
          },
        });

        return () => {
          st.kill();
          tl.kill();
        };
      });

      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [reducedMotion] },
  );

  return (
    <section
      ref={sectionRef}
      data-nav-theme="dark"
      data-featured-stack=""
      className="section_featured theme-dark relative border-y border-[var(--swatch-dark-border)]"
    >
      <div
        ref={pinRef}
        data-featured-stack-pin=""
        className="padding-global py-16 lg:py-0 lg:min-h-screen flex flex-col justify-center"
      >
        <div className="container-editorial w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
            <div>
              <p className="eyebrow-m mb-3">Flagship Workflows</p>
              <ScrollReveal mode="chars">
                <h2 className="heading-xl text-[var(--swatch-dark-ink)]">Featured Tools</h2>
              </ScrollReveal>
            </div>

            {/* Rotating Circular Scroll Badge */}
            <div
              ref={badgeRef}
              data-featured-stack-badge=""
              aria-hidden="true"
              className="hidden lg:flex w-24 h-24 items-center justify-center rounded-full border border-white/20 text-[var(--swatch-accent-glow)] shrink-0"
            >
              <svg viewBox="0 0 100 100" className="w-20 h-20">
                <defs>
                  <path
                    id="scrollCirclePath"
                    d="M 50, 50 m -36, 0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0"
                  />
                </defs>
                <text fill="currentColor" fontSize="9.5" fontWeight="700" letterSpacing="2.4">
                  <textPath href="#scrollCirclePath">SCROLL • EXPLORE • STACK •</textPath>
                </text>
              </svg>
            </div>
          </div>

          {/* Desktop 3D Stack / Mobile Clean Stack */}
          <div
            data-featured-stack-root=""
            className="relative grid grid-cols-1 md:grid-cols-2 lg:block lg:h-[26rem] max-w-4xl mx-auto gap-5"
          >
            {FEATURED_WORKFLOWS.map((card) => (
              <div
                key={card.id}
                data-featured-stack-slide=""
                className="lg:absolute lg:inset-0"
              >
                <TransitionLink
                  href={card.slug}
                  data-cursor-marquee-text="Launch tool →"
                  className="h-full rounded-[2rem] p-7 sm:p-10 flex flex-col justify-between border-[1.5px] border-[var(--swatch-ink)] shadow-[8px_8px_0_var(--swatch-accent-glow)] no-underline transition-transform hover:scale-[1.01]"
                  style={{ backgroundColor: card.bg, color: card.ink }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/75">
                      {card.eyebrow}
                    </span>
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-black/10">
                      <ArrowUpRight className="w-5 h-5" />
                    </span>
                  </div>

                  <div className="my-6">
                    <h3 className="heading-m text-[var(--swatch-ink)]">{card.title}</h3>
                    <p className="mt-3 text-base sm:text-lg opacity-85 max-w-2xl leading-relaxed">
                      {card.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs sm:text-sm font-mono font-semibold pt-4 border-t-[1.5px] border-black/70">
                    <span>{card.badge}</span>
                    <span>Open workspace →</span>
                  </div>
                </TransitionLink>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

