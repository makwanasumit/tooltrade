"use client";

import React from "react";
import { TransitionLink } from "@/components/motion/TransitionLink";

interface Button093Props {
  href?: string;
  onClick?: () => void;
  children: string;
  className?: string;
}

export function Button093({ href, onClick, children, className = "" }: Button093Props) {
  const inner = (
    <span className="button-093__inner">
      <span className="button-093__dot-wrap" aria-hidden="true">
        <span className="button-093__dot" />
        <span className="button-093__dot-cluster">
          <span style={{ "--index": 0 } as React.CSSProperties} className="button-093__dot-item is--first" />
          <span style={{ "--index": 1 } as React.CSSProperties} className="button-093__dot-item is--second" />
          <span style={{ "--index": 2 } as React.CSSProperties} className="button-093__dot-item is--third" />
        </span>
      </span>
      <span className="button-093__text-wrap">
        <span className="button-093__text is--default">{children}</span>
        <span className="button-093__text is--hover" aria-hidden="true">
          {children}
        </span>
      </span>
    </span>
  );

  if (href) {
    return (
      <TransitionLink href={href} data-button-093="" className={`button-093 ${className}`}>
        {inner}
      </TransitionLink>
    );
  }

  return (
    <button type="button" onClick={onClick} data-button-093="" className={`button-093 ${className}`}>
      {inner}
    </button>
  );
}

