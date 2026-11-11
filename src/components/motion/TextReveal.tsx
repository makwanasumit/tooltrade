"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { useMotion } from "./MotionProvider";

interface TextRevealProps {
  children: React.ReactNode;
  mode?: "chars" | "lines";
  delay?: number;
  staggerStep?: number;
  as?: "h1" | "h2" | "h3" | "p" | "div" | "span";
  className?: string;
}

export function TextReveal({
  children,
  mode = "lines",
  delay = 0,
  staggerStep = 0.07,
  as: Tag = "div",
  className = "",
}: TextRevealProps) {
  const elRef = useRef<HTMLElement>(null);
  const { reducedMotion } = useMotion();

  useGSAP(
    () => {
      const el = elRef.current;
      if (!el || reducedMotion) return;

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
            duration: 0.95,
            delay,
            ease: "expo.out",
            stagger: mode === "chars" ? { each: staggerStep * 0.25, from: "start" } : staggerStep,
            overwrite: true,
          },
        );
      });

      return () => {
        cancelled = true;
        split?.revert();
      };
    },
    { scope: elRef, dependencies: [mode, delay, staggerStep, reducedMotion] },
  );

  return (
    <Tag
      ref={elRef as React.RefObject<never>}
      data-text-reveal={mode}
      className={`split-mask ${className}`}
    >
      {children}
    </Tag>
  );
}

