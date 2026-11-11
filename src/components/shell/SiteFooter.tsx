"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { DrawLine } from "@/components/motion/DrawLine";
import { VariableWeightText } from "@/components/motion/VariableWeightText";
import { Button052 } from "@/components/ui/Button052";
import { ScrollTopBtn } from "@/components/ui/ScrollTopBtn";
import { useMotion } from "@/components/motion/MotionProvider";
import { CATEGORIES } from "@/lib/tools/registry";

const TRAIL_STICKERS = [
  { label: "0 KB Uploaded", bg: "#5B2BFF", fg: "#FFFFFF" },
  { label: "Diff Checked", bg: "#FF4D2E", fg: "#FFFFFF" },
  { label: "Exact / Est.", bg: "#D6F23A", fg: "#0F0F0F" },
  { label: "Local Worker", bg: "#2F6BFF", fg: "#FFFFFF" },
  { label: "No Account", bg: "#17A673", fg: "#FFFFFF" },
];

export function SiteFooter() {
  const trailRef = useRef<HTMLDivElement>(null);
  const { isDesktopFinePointer, reducedMotion } = useMotion();

  useEffect(() => {
    const container = trailRef.current;
    if (!container || !isDesktopFinePointer || reducedMotion) return;

    let lastX = 0;
    let lastY = 0;
    let index = 0;
    const minSpacing = 88;

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (Math.hypot(x - lastX, y - lastY) < minSpacing) return;
      lastX = x;
      lastY = y;

      const sticker = TRAIL_STICKERS[index % TRAIL_STICKERS.length]!;
      index++;

      const badge = document.createElement("div");
      badge.className = "created-trail-img pointer-events-none select-none";
      badge.style.left = `${x}px`;
      badge.style.top = `${y}px`;
      badge.style.transform = "translate(-50%, -50%)";
      badge.innerHTML = `<span style="display:inline-block;padding:0.42rem 0.85rem;border-radius:9999px;font-weight:700;font-size:0.75rem;white-space:nowrap;background:${sticker.bg};color:${sticker.fg};box-shadow:0 8px 24px rgba(0,0,0,0.28);">${sticker.label}</span>`;

      container.appendChild(badge);

      const angle = (Math.random() - 0.5) * 26;
      gsap.fromTo(
        badge,
        { scale: 0.45, opacity: 0, rotation: angle - 10 },
        {
          scale: 1,
          opacity: 0.94,
          rotation: angle,
          duration: 0.35,
          ease: "back.out(2)",
          onComplete: () => {
            gsap.to(badge, {
              y: 28,
              scale: 0.72,
              opacity: 0,
              duration: 0.75,
              delay: 0.25,
              ease: "power2.in",
              onComplete: () => badge.remove(),
            });
          },
        },
      );
    };

    container.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => container.removeEventListener("pointermove", onPointerMove);
  }, [isDesktopFinePointer, reducedMotion]);

  return (
    <footer className="footer theme-dark border-t border-[var(--swatch-dark-border)]" data-nav-theme="dark">
      {/* CTA Band with Interactive Image/Sticker Trail */}
      <div
        ref={trailRef}
        data-image-trail=""
        className="footer-cta padding-global py-20 md:py-28 border-b border-[var(--swatch-dark-border)]"
      >
        <div className="container-editorial relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div className="max-w-3xl">
            <p className="eyebrow-m mb-4">Privacy-First Everyday Utility</p>
            <h2 className="heading-xl text-[var(--swatch-dark-ink)]">
              <VariableWeightText weightRest={700} weightNear={250} radius={400}>
                Fast local tools.
              </VariableWeightText>
              <br />
              <VariableWeightText
                weightRest={300}
                weightNear={800}
                radius={400}
                className="heading-alt text-[var(--swatch-accent-glow)]"
              >
                Zero guesswork.
              </VariableWeightText>
            </h2>
            <p className="mt-6 text-base md:text-lg text-[var(--swatch-dark-muted)] max-w-xl leading-relaxed">
              Every tool runs directly in your browser without mandatory accounts or silent uploads.
              Verify our network traffic yourself in sixty seconds.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button052 href="/tools">Explore All 16 Tools</Button052>
              <TransitionLink
                href="/guides/verify-local-processing"
                className="text-sm font-semibold text-[var(--swatch-dark-ink)] hover:text-[var(--swatch-accent-glow)] transition-colors no-underline px-3 py-2"
              >
                <DrawLine>How to verify zero uploads →</DrawLine>
              </TransitionLink>
            </div>
          </div>

          <ScrollTopBtn />
        </div>
      </div>

      {/* Footer Navigation Grid */}
      <div className="padding-global py-14">
        <div className="container-editorial grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 text-sm">
          <div>
            <p className="font-bold text-base text-[var(--swatch-dark-ink)] mb-3">
              Everyday Tools Hub
            </p>
            <p className="text-[var(--swatch-dark-muted)] leading-relaxed">
              Free browser-local image, PDF, text, JSON, QR, date, and AI Prep utilities with honest
              accuracy labels.
            </p>
          </div>

          <div>
            <p className="font-semibold text-[var(--swatch-dark-ink)] mb-3 uppercase tracking-wider text-xs">
              Categories
            </p>
            <ul className="space-y-2.5 text-[var(--swatch-dark-muted)]">
              {CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <TransitionLink
                    href={`/categories/${cat.slug}`}
                    className="hover:text-[var(--swatch-dark-ink)] no-underline transition-colors"
                  >
                    <DrawLine>{cat.name}</DrawLine>
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-semibold text-[var(--swatch-dark-ink)] mb-3 uppercase tracking-wider text-xs">
              Trust &amp; Guides
            </p>
            <ul className="space-y-2.5 text-[var(--swatch-dark-muted)]">
              <li>
                <TransitionLink href="/accuracy" className="hover:text-[var(--swatch-dark-ink)] no-underline">
                  <DrawLine>Accuracy &amp; Corpus Results</DrawLine>
                </TransitionLink>
              </li>
              <li>
                <TransitionLink
                  href="/guides/verify-local-processing"
                  className="hover:text-[var(--swatch-dark-ink)] no-underline"
                >
                  <DrawLine>Verify Local Processing</DrawLine>
                </TransitionLink>
              </li>
              <li>
                <TransitionLink href="/guides" className="hover:text-[var(--swatch-dark-ink)] no-underline">
                  <DrawLine>All Task Guides</DrawLine>
                </TransitionLink>
              </li>
              <li>
                <TransitionLink href="/about" className="hover:text-[var(--swatch-dark-ink)] no-underline">
                  <DrawLine>About &amp; Standards</DrawLine>
                </TransitionLink>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-[var(--swatch-dark-ink)] mb-3 uppercase tracking-wider text-xs">
              Policies &amp; Contact
            </p>
            <ul className="space-y-2.5 text-[var(--swatch-dark-muted)]">
              <li>
                <TransitionLink href="/privacy-policy" className="hover:text-[var(--swatch-dark-ink)] no-underline">
                  <DrawLine>Privacy Policy</DrawLine>
                </TransitionLink>
              </li>
              <li>
                <TransitionLink href="/terms" className="hover:text-[var(--swatch-dark-ink)] no-underline">
                  <DrawLine>Terms of Use</DrawLine>
                </TransitionLink>
              </li>
              <li>
                <TransitionLink
                  href="/cookie-preferences"
                  className="hover:text-[var(--swatch-dark-ink)] no-underline"
                >
                  <DrawLine>Cookie Preferences</DrawLine>
                </TransitionLink>
              </li>
              <li>
                <TransitionLink href="/accessibility" className="hover:text-[var(--swatch-dark-ink)] no-underline">
                  <DrawLine>Accessibility Statement</DrawLine>
                </TransitionLink>
              </li>
              <li>
                <TransitionLink href="/contact" className="hover:text-[var(--swatch-dark-ink)] no-underline">
                  <DrawLine>Contact</DrawLine>
                </TransitionLink>
              </li>
            </ul>
          </div>
        </div>

        <div className="container-editorial mt-12 pt-6 border-t border-[var(--swatch-dark-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[var(--swatch-dark-muted)]">
          <p>© {new Date().getFullYear()} Everyday Tools Hub. Client-side utility suite.</p>
          <p>Built for clarity, verifiable local execution, and WCAG 2.2 AA accessibility.</p>
        </div>
      </div>
    </footer>
  );
}

