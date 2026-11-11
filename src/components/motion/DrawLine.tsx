"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { useMotion } from "./MotionProvider";

interface DrawLineProps {
  children: React.ReactNode;
  active?: boolean;
  always?: boolean;
  persist?: boolean;
  className?: string;
}

export function DrawLine({
  children,
  active = false,
  always = false,
  persist = false,
  className = "",
}: DrawLineProps) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const { reducedMotion } = useMotion();

  const shouldStayDrawn = always || (persist && active);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    if (reducedMotion) {
      gsap.set(path, { drawSVG: shouldStayDrawn ? "0% 100%" : "0% 0%" });
      return;
    }

    gsap.set(path, { drawSVG: shouldStayDrawn ? "0% 100%" : "0% 0%" });
  }, [shouldStayDrawn, reducedMotion]);

  const handleEnter = () => {
    const path = pathRef.current;
    if (!path || shouldStayDrawn) return;
    if (reducedMotion) {
      gsap.set(path, { drawSVG: "0% 100%" });
      return;
    }
    gsap.fromTo(
      path,
      { drawSVG: "0% 0%" },
      { drawSVG: "0% 100%", duration: 0.5, ease: "power2.inOut", overwrite: true },
    );
  };

  const handleLeave = () => {
    const path = pathRef.current;
    if (!path || shouldStayDrawn) return;
    if (reducedMotion) {
      gsap.set(path, { drawSVG: "0% 0%" });
      return;
    }
    gsap.to(path, {
      drawSVG: "100% 100%",
      duration: 0.5,
      ease: "power2.inOut",
      overwrite: true,
    });
  };

  return (
    <span
      ref={wrapRef}
      data-draw-line=""
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
      className={`text-draw-wrap ${className}`}
    >
      <span className="text-draw__span">{children}</span>
      <span data-draw-line-box="" aria-hidden="true">
        <svg viewBox="0 0 100 4" preserveAspectRatio="none" fill="none">
          <path
            ref={pathRef}
            d="M 0 2 Q 50 1 100 2"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </span>
  );
}

