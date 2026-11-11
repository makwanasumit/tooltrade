"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useMotion } from "@/components/motion/MotionProvider";

const MARQUEE_ITEMS = [
  "Runs on Your Device",
  "Zero Server Uploads",
  "Network-Audit Gated",
  "Exact • Estimated • Heuristic Labels",
  "Diff-First AI Prep",
  "No Account Required",
  "WCAG 2.2 AA Accessible",
];

export function TrustMarquee() {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const { reducedMotion } = useMotion();

  useGSAP(
    () => {
      const root = rootRef.current;
      const track = trackRef.current;
      if (!root || !track || reducedMotion) return;

      const tween = gsap.to(track, {
        xPercent: -50,
        duration: 28,
        repeat: -1,
        ease: "none",
      });

      const st = ScrollTrigger.create({
        trigger: root,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const targetScale = self.direction === -1 ? -1 : 1;
          gsap.to(tween, { timeScale: targetScale, duration: 0.35, overwrite: true });
        },
      });

      return () => {
        st.kill();
        tween.kill();
      };
    },
    { scope: rootRef, dependencies: [reducedMotion] },
  );

  return (
    <div
      ref={rootRef}
      data-marquee-scroll-direction-target=""
      className="border-t-[1.5px] border-[var(--swatch-ink)] bg-[var(--swatch-ink)] py-4 overflow-hidden select-none"
      aria-label="Trust and privacy guarantees"
    >
      <div ref={trackRef} className="marquee-track items-center">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex items-center shrink-0">
            {MARQUEE_ITEMS.map((item, i) => (
              <span
                key={`${dup}-${i}`}
                className="inline-flex items-center gap-4 px-5 text-xs sm:text-sm font-semibold uppercase tracking-wider font-mono text-[var(--swatch-dark-ink)] whitespace-nowrap"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      i % 3 === 0 ? "#D6F23A" : i % 3 === 1 ? "#FF4D2E" : "#7FA6FF",
                  }}
                />
                {item}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

