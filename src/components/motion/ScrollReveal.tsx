"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { useMotion } from "./MotionProvider";

interface ScrollRevealProps {
  children: React.ReactNode;
  mode?: "element" | "chars" | "lines";
  delay?: number;
  className?: string;
}

export function ScrollReveal({
  children,
  mode = "element",
  delay = 0,
  className = "",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { reducedMotion } = useMotion();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || reducedMotion) return;

      if (mode === "element") {
        gsap.fromTo(
          el,
          { y: 24, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.8,
            delay,
            ease: "expo.out",
            overwrite: true,
            scrollTrigger: {
              trigger: el,
              start: "top 86%",
              once: true,
              refreshPriority: -1,
            },
          },
        );
        return;
      }

      let split: SplitText | null = null;
      let cancelled = false;
      document.fonts.ready.then(() => {
        if (cancelled || !el) return;
        split = new SplitText(el, {
          type: mode === "chars" ? "chars,words,lines" : "lines,words",
          linesClass: "line",
          charsClass: "char",
          mask: "lines",
          autoSplit: true,
          aria: "none",
        });
        const targets = mode === "chars" ? split.chars : split.lines;
        gsap.fromTo(
          targets,
          { yPercent: 120 },
          {
            yPercent: 0,
            duration: 0.9,
            delay,
            ease: "expo.out",
            stagger: mode === "chars" ? { each: 0.0175, from: "start" } : 0.07,
            scrollTrigger: {
              trigger: el,
              start: "top 86%",
              once: true,
              refreshPriority: -1,
            },
          },
        );
      });

      return () => {
        cancelled = true;
        split?.revert();
      };
    },
    { scope: ref, dependencies: [mode, delay, reducedMotion] },
  );

  return (
    <div
      ref={ref}
      data-scroll-reveal={mode}
      className={mode === "element" ? className : `split-mask ${className}`}
    >
      {children}
    </div>
  );
}

