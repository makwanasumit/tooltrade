"use client";

import React, { useRef } from "react";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { useMotion } from "./MotionProvider";

interface VariableWeightTextProps {
  children: React.ReactNode;
  weightRest?: number;
  weightNear?: number;
  radius?: number;
  className?: string;
}

export function VariableWeightText({
  children,
  weightRest = 700,
  weightNear = 250,
  radius = 400,
  className = "",
}: VariableWeightTextProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const { isDesktopFinePointer, reducedMotion } = useMotion();

  useGSAP(
    () => {
      const container = spanRef.current;
      if (!container || !isDesktopFinePointer || reducedMotion) return;

      let split: SplitText | null = null;
      let cancelled = false;
      let rafId = 0;

      interface CharMetric {
        el: HTMLElement;
        cx: number;
        cy: number;
      }
      let metrics: CharMetric[] = [];

      const measureChars = () => {
        if (!split) return;
        metrics = (split.chars as HTMLElement[]).map((el) => {
          const rect = el.getBoundingClientRect();
          return {
            el,
            cx: rect.left + rect.width / 2 + window.scrollX,
            cy: rect.top + rect.height / 2 + window.scrollY,
          };
        });
      };

      document.fonts.ready.then(() => {
        if (cancelled || !container) return;
        split = new SplitText(container, {
          type: "chars,words",
          charsClass: "vw-char",
          aria: "none",
        });
        measureChars();
      });

      const onPointerMove = (e: PointerEvent) => {
        if (rafId) return;
        const px = e.pageX;
        const py = e.pageY;
        rafId = requestAnimationFrame(() => {
          rafId = 0;
          for (const item of metrics) {
            const dx = px - item.cx;
            const dy = py - item.cy;
            const dist = Math.hypot(dx, dy);
            if (dist < radius) {
              const t = 1 - dist / radius;
              const eased = t * t * (3 - 2 * t);
              const w = Math.round(weightRest + (weightNear - weightRest) * eased);
              item.el.style.fontVariationSettings = `"wght" ${w}`;
              item.el.style.fontWeight = String(w);
            } else {
              item.el.style.fontVariationSettings = `"wght" ${weightRest}`;
              item.el.style.fontWeight = String(weightRest);
            }
          }
        });
      };

      const onResize = () => measureChars();

      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("resize", onResize, { passive: true });

      return () => {
        cancelled = true;
        if (rafId) cancelAnimationFrame(rafId);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("resize", onResize);
        split?.revert();
      };
    },
    { scope: spanRef, dependencies: [weightRest, weightNear, radius, isDesktopFinePointer, reducedMotion] },
  );

  return (
    <span
      ref={spanRef}
      data-font-weight-hover=""
      data-weight-rest={weightRest}
      data-weight-near={weightNear}
      data-radius={radius}
      className={className}
    >
      {children}
    </span>
  );
}

