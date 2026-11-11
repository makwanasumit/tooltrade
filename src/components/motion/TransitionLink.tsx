"use client";

import React from "react";
import Link, { type LinkProps } from "next/link";
import { useMotion } from "./MotionProvider";

type TransitionLinkProps = LinkProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    children: React.ReactNode;
    skipTransition?: boolean;
  };

export function TransitionLink({
  href,
  onClick,
  skipTransition = false,
  children,
  ...rest
}: TransitionLinkProps) {
  const { navigateWithTransition, reducedMotion } = useMotion();
  const hrefString = typeof href === "string" ? href : href.pathname ?? "/";

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (
      e.defaultPrevented ||
      skipTransition ||
      reducedMotion ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      e.button !== 0 ||
      rest.target === "_blank"
    ) {
      return;
    }

    // Direct tool workspaces bypass the spiral curtain for instant task-first entry
    if (hrefString.startsWith("/tools/") && hrefString !== "/tools") {
      return;
    }

    e.preventDefault();
    navigateWithTransition(hrefString);
  };

  return (
    <Link href={href} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}

