"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useMotion } from "./MotionProvider";

export function CursorMarquee() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"active" | "not-active">("not-active");
  const [label, setLabel] = useState("Open tool →");
  const { isDesktopFinePointer, reducedMotion } = useMotion();

  useEffect(() => {
    const el = cursorRef.current;
    if (!el || !isDesktopFinePointer || reducedMotion) {
      setStatus("not-active");
      return;
    }

    const xTo = gsap.quickTo(el, "left", { duration: 0.28, ease: "power3" });
    const yTo = gsap.quickTo(el, "top", { duration: 0.28, ease: "power3" });

    const onPointerMove = (e: PointerEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);

      const target = e.target as HTMLElement | null;
      if (!target || target.closest("[data-tool-workspace]")) {
        setStatus("not-active");
        return;
      }

      const trigger = target.closest<HTMLElement>("[data-cursor-marquee-text]");
      if (trigger) {
        const nextText = trigger.getAttribute("data-cursor-marquee-text") || "Open tool →";
        setLabel(nextText);
        setStatus("active");
      } else {
        setStatus("not-active");
      }
    };

    const onPointerLeave = () => setStatus("not-active");

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("mouseleave", onPointerLeave);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("mouseleave", onPointerLeave);
    };
  }, [isDesktopFinePointer, reducedMotion]);

  if (!isDesktopFinePointer || reducedMotion) return null;

  return (
    <div
      ref={cursorRef}
      data-cursor-marquee-status={status}
      className="cursor-marquee"
      aria-hidden="true"
    >
      <div className="cursor-marquee__card">
        <div className="cursor-marquee__track">
          <span className="cursor-marquee__text-span">{label}</span>
          <span className="cursor-marquee__text-span">{label}</span>
          <span className="cursor-marquee__text-span">{label}</span>
          <span className="cursor-marquee__text-span">{label}</span>
        </div>
      </div>
    </div>
  );
}

