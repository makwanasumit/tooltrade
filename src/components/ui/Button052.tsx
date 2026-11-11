"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { TransitionLink } from "@/components/motion/TransitionLink";

interface Button052Props {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}

export function Button052({
  href,
  onClick,
  children,
  className = "",
  type = "button",
  disabled = false,
}: Button052Props) {
  const inner = (
    <>
      <span className="button-052__icon-slot" aria-hidden="true">
        <ArrowRight className="button-052__icon is--default" />
        <ArrowRight className="button-052__icon is--hover" />
      </span>
      <span className="button-052__text-wrap">
        <span className="button-052__text">{children}</span>
      </span>
    </>
  );

  if (href) {
    return (
      <TransitionLink href={href} data-button-052="" className={`button-052 ${className}`}>
        {inner}
      </TransitionLink>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      data-button-052=""
      className={`button-052 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {inner}
    </button>
  );
}

