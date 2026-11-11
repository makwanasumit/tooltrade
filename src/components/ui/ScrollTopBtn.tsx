"use client";

import React from "react";
import { ArrowUp } from "lucide-react";
import { useMotion } from "@/components/motion/MotionProvider";

export function ScrollTopBtn({ className = "" }: { className?: string }) {
  const { scrollToTop } = useMotion();

  return (
    <button
      type="button"
      data-scroll-top=""
      onClick={scrollToTop}
      aria-label="Scroll back to top"
      className={`scroll-top-btn ${className}`}
    >
      <ArrowUp className="w-4 h-4" aria-hidden="true" />
      <span className="scroll-top-btn__bg" aria-hidden="true" />
    </button>
  );
}

