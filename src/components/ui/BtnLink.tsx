"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { DrawLine } from "@/components/motion/DrawLine";

interface BtnLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function BtnLink({ href, children, className = "" }: BtnLinkProps) {
  return (
    <TransitionLink href={href} className={`btn-link ${className}`}>
      <DrawLine always>{children}</DrawLine>
      <span className="btn-link__arrow" aria-hidden="true">
        <ArrowUpRight className="w-4 h-4" />
      </span>
    </TransitionLink>
  );
}

