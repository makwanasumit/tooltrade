"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";

interface TransitionDetail {
  phase: "leave";
  onMidpoint: () => void;
  onComplete: () => void;
}

export function TransitionOverlay() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const handleTransition = (ev: Event) => {
      const detail = (ev as CustomEvent<TransitionDetail>).detail;
      const wrap = wrapRef.current;
      const path = pathRef.current;
      if (!wrap || !path || !detail) {
        detail?.onMidpoint?.();
        detail?.onComplete?.();
        return;
      }

      wrap.setAttribute("data-transition-active", "true");

      const tl = gsap.timeline({
        onComplete: () => {
          wrap.removeAttribute("data-transition-active");
          gsap.set(path, { drawSVG: "0% 0%", strokeWidth: 0 });
          detail.onComplete();
        },
      });

      // Fast, fluid Extrafazant spiral wipe adapted for responsive utility navigation (~0.62s total)
      tl.set(path, { drawSVG: "0% 0%", strokeWidth: "28%" })
        .to(path, {
          drawSVG: "0% 100%",
          duration: 0.34,
          ease: "power2.inOut",
        })
        .add(() => {
          detail.onMidpoint();
        })
        .to(path, {
          drawSVG: "100% 100%",
          strokeWidth: "5%",
          duration: 0.34,
          ease: "power1.inOut",
        });
    };

    window.addEventListener("eth:route-transition", handleTransition);
    return () => window.removeEventListener("eth:route-transition", handleTransition);
  }, []);

  return (
    <div ref={wrapRef} data-transition-wrap="" className="transition" aria-hidden="true">
      <div className="transition__shape">
        <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" className="transition__svg" fill="none">
          <path
            ref={pathRef}
            d="M43 259C296 11.5688 994 -3 922.994 498.259C851.988 999.517 281.229 1004.28 123 767C-35.2287 529.721 179 259 472 259C765 259 792 498.259 659 654C526 809.741 319 755 285 669.001C251 583.001 299 452 496 452C693 452 876.073 639.171 935 937.001"
            stroke="currentColor"
            strokeWidth="0"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}

