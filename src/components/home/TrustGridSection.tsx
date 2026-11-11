"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { useMotion } from "@/components/motion/MotionProvider";
import { Cpu, FileCheck2, Gauge, Microscope } from "lucide-react";

const TRUST_PILLARS = [
  {
    id: "pillar-worker",
    title: "Off-Thread Web Workers",
    desc: "Heavy image resizing, PDF assembly, and huge text scans run inside Web Workers so your UI stays responsive.",
    icon: Cpu,
    tint: "#EEE9FF",
    href: "/tools",
  },
  {
    id: "pillar-corpus",
    title: "Published Precision & Recall",
    desc: "Our PII and hidden-text detectors run the exact same code in production and our public synthetic corpus benchmark.",
    icon: Microscope,
    tint: "#E8F0FF",
    href: "/accuracy",
  },
  {
    id: "pillar-audit",
    title: "Audit-Gated Local Badges",
    desc: "A tool cannot display 'Processed on your device' unless a dated network-inspection audit record exists in the registry.",
    icon: FileCheck2,
    tint: "#EAF6F1",
    href: "/guides/verify-local-processing",
  },
  {
    id: "pillar-vitals",
    title: "Built for Fast Task Completion",
    desc: "Zero artificial loading animations on tool pages, magic-byte file verification, and instant object URL memory cleanup.",
    icon: Gauge,
    tint: "#F7FCD9",
    href: "/tools/token-counter",
  },
] as const;

export function TrustGridSection() {
  const listRef = useRef<HTMLDivElement>(null);
  const { isDesktopFinePointer, reducedMotion } = useMotion();

  useGSAP(
    () => {
      const list = listRef.current;
      if (!list || !isDesktopFinePointer || reducedMotion) return;

      const items = Array.from(list.querySelectorAll<HTMLElement>("[data-team-parallax-item]"));
      const triggers: gsap.core.Tween[] = [];

      items.forEach((item, index) => {
        const distance = index % 2 === 0 ? -45 : 45;
        const tween = gsap.to(item, {
          y: distance,
          ease: "none",
          scrollTrigger: {
            trigger: item,
            start: "clamp(top bottom)",
            end: "clamp(bottom top)",
            scrub: true,
            invalidateOnRefresh: true,
          },
        });
        triggers.push(tween);
      });

      return () => triggers.forEach((t) => t.kill());
    },
    { scope: listRef, dependencies: [isDesktopFinePointer, reducedMotion] },
  );

  // Momentum Hover using GSAP InertiaPlugin
  const handleMomentumMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDesktopFinePointer || reducedMotion) return;
    const target = e.currentTarget.querySelector<HTMLElement>("[data-momentum-hover-target]");
    if (!target) return;

    const vx = Math.max(-180, Math.min(180, e.movementX * 9));
    const vy = Math.max(-180, Math.min(180, e.movementY * 9));
    const rot = Math.max(-6, Math.min(6, e.movementX * 0.45));

    gsap.to(target, {
      inertia: {
        x: { velocity: vx, end: 0 },
        y: { velocity: vy, end: 0 },
        rotation: { velocity: rot * 8, end: 0 },
        resistance: 950,
      },
      overwrite: "auto",
    });
  };

  return (
    <section className="section_team padding-global py-20 md:py-28 bg-[var(--swatch-volt)] border-t-[1.5px] border-[var(--swatch-ink)] overflow-hidden">
      <div className="container-editorial">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <p className="eyebrow-m mb-3">Architecture &amp; Standards</p>
            <ScrollReveal mode="chars">
              <h2 className="heading-xl text-[var(--theme-heading)]">
                Built to inspect.
              </h2>
            </ScrollReveal>
          </div>

          {/* Decorative Kinetic Trust Stickers */}
          <div className="flex flex-wrap gap-2.5" aria-hidden="true">
            <span className="px-3.5 py-1.5 rounded-full border-[1.5px] border-[var(--swatch-ink)] bg-[var(--swatch-accent)] text-white text-xs font-bold">
              0 KB Uploaded
            </span>
            <span className="px-3.5 py-1.5 rounded-full border-[1.5px] border-[var(--swatch-ink)] bg-[var(--swatch-coral-card)] text-[var(--swatch-ink)] text-xs font-bold">
              No eval()
            </span>
            <span className="px-3.5 py-1.5 rounded-full border-[1.5px] border-[var(--swatch-ink)] bg-white text-[var(--swatch-ink)] text-xs font-bold">
              WCAG 2.2 AA
            </span>
          </div>
        </div>

        <div ref={listRef} data-team-parallax="" className="team_list">
          {TRUST_PILLARS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                data-team-parallax-item=""
                onPointerMove={handleMomentumMove}
                className="team_item"
              >
                <TransitionLink
                  href={item.href}
                  data-momentum-hover-target=""
                  className="block rounded-[var(--radius-lg)] p-7 bg-[var(--theme-surface)] border-[1.5px] border-[var(--swatch-ink)] shadow-[4px_4px_0_var(--swatch-ink)] hover:shadow-[7px_7px_0_var(--swatch-ink)] transition-shadow no-underline text-[var(--theme-text)] will-change-transform"
                >
                  <div
                    className="w-12 h-12 rounded-full border-[1.5px] border-[var(--swatch-ink)] flex items-center justify-center mb-5"
                    style={{ backgroundColor: item.tint }}
                  >
                    <Icon className="w-6 h-6 text-[var(--swatch-ink)]" />
                  </div>
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <p className="mt-2.5 text-sm text-[var(--theme-text-muted)] leading-relaxed">
                    {item.desc}
                  </p>
                </TransitionLink>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

