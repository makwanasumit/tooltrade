"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { DrawLine } from "@/components/motion/DrawLine";
import { Button093 } from "@/components/ui/Button093";
import { useMotion } from "@/components/motion/MotionProvider";

const NAV_LINKS = [
  { href: "/tools", label: "Tools" },
  { href: "/categories/ai-prep-tools", label: "AI Prep" },
  { href: "/guides", label: "Guides" },
  { href: "/accuracy", label: "Accuracy" },
  { href: "/about", label: "About" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const lineTopRef = useRef<HTMLSpanElement>(null);
  const lineBotRef = useRef<HTMLSpanElement>(null);
  const [menuOpenPath, setMenuOpenPath] = useState<string | null>(null);
  const menuOpen = menuOpenPath === pathname;
  const setMenuOpen = (next: boolean | ((prev: boolean) => boolean)) => {
    setMenuOpenPath((prevPath) => {
      const wasOpen = prevPath === pathname;
      const shouldOpen = typeof next === "function" ? next(wasOpen) : next;
      return shouldOpen ? pathname : null;
    });
  };
  const [darkActive, setDarkActive] = useState(false);
  const { pauseScroll, resumeScroll, reducedMotion } = useMotion();

  // Dynamic Nav Theme Auto-Switch based on [data-nav-theme="dark"] sections
  useEffect(() => {
    const triggers: ScrollTrigger[] = [];
    const navEl = navRef.current;

    const timer = setTimeout(() => {
      const navHeight = navEl?.offsetHeight || 72;
      const darkSections = document.querySelectorAll<HTMLElement>('[data-nav-theme="dark"]');
      const initialActive = Array.from(darkSections).some((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top <= navHeight && rect.bottom >= navHeight;
      });
      setDarkActive(initialActive);

      darkSections.forEach((section) => {
        const st = ScrollTrigger.create({
          trigger: section,
          start: `top ${navHeight}px`,
          end: `bottom ${navHeight}px`,
          onToggle: (self) => {
            if (self.isActive) {
              setDarkActive(true);
            } else {
              const anyActive = Array.from(darkSections).some((el) => {
                const rect = el.getBoundingClientRect();
                return rect.top <= navHeight && rect.bottom >= navHeight;
              });
              setDarkActive(anyActive);
            }
          },
        });
        triggers.push(st);
      });
    }, 80);

    return () => {
      clearTimeout(timer);
      triggers.forEach((t) => t.kill());
    };
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) {
      resumeScroll();
    } else {
      pauseScroll();
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && menuOpen) {
        setMenuOpenPath(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen, pauseScroll, resumeScroll]);

  // Animate mobile menu drawer & two-bar toggle (power3.inOut, 0.6s)
  useEffect(() => {
    const panel = menuPanelRef.current;
    const topBar = lineTopRef.current;
    const botBar = lineBotRef.current;
    if (!panel || !topBar || !botBar) return;

    if (reducedMotion) {
      panel.style.display = menuOpen ? "block" : "none";
      return;
    }

    if (menuOpen) {
      gsap.set(panel, { display: "block" });
      gsap.fromTo(
        panel,
        { clipPath: "inset(0% 0% 100% 0%)", opacity: 0 },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          opacity: 1,
          duration: 0.6,
          ease: "power3.inOut",
          overwrite: true,
        },
      );
      gsap.to(topBar, { y: 4, rotate: 45, duration: 0.35, ease: "power2.out" });
      gsap.to(botBar, { y: -4, rotate: -45, duration: 0.35, ease: "power2.out" });
    } else {
      gsap.to(panel, {
        clipPath: "inset(0% 0% 100% 0%)",
        opacity: 0,
        duration: 0.45,
        ease: "power3.inOut",
        overwrite: true,
        onComplete: () => {
          gsap.set(panel, { display: "none" });
        },
      });
      gsap.to(topBar, { y: 0, rotate: 0, duration: 0.3, ease: "power2.out" });
      gsap.to(botBar, { y: 0, rotate: 0, duration: 0.3, ease: "power2.out" });
    }
  }, [menuOpen, reducedMotion]);

  return (
    <header
      ref={navRef}
      data-nav=""
      data-nav-theme-active={darkActive ? "dark" : undefined}
      className="site-nav fixed top-0 left-0 right-0 z-50 h-[var(--nav-height)] flex items-center"
    >
      <div className="padding-global w-full">
        <div className="container-editorial flex items-center justify-between gap-4">
          {/* Custom SVG Wordmark */}
          <TransitionLink
            href="/"
            className="nav-logo inline-flex items-center gap-2.5 font-bold tracking-tight text-base sm:text-lg no-underline"
            aria-label="Everyday Tools Hub home"
          >
            <svg
              width="30"
              height="30"
              viewBox="0 0 32 32"
              fill="none"
              aria-hidden="true"
              className="shrink-0"
            >
              <rect width="32" height="32" rx="9" fill="#5B2BFF" />
              <rect x="6.5" y="7.5" width="9" height="9" rx="2.5" fill="#F4F2EE" />
              <circle cx="21.5" cy="12" r="4.5" fill="#D6F23A" />
              <path
                d="M7 22.5C7 20.8431 8.34315 19.5 10 19.5H22C23.6569 19.5 25 20.8431 25 22.5C25 24.1569 23.6569 25.5 22 25.5H10C8.34315 25.5 7 24.1569 7 22.5Z"
                fill="#FF4D2E"
              />
            </svg>
            <span>Everyday Tools</span>
          </TransitionLink>

          {/* Desktop Nav Links */}
          <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-7 text-sm font-semibold">
            {NAV_LINKS.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <TransitionLink
                  key={item.href}
                  href={item.href}
                  className="no-underline text-current hover:opacity-85 transition-opacity"
                >
                  <DrawLine persist active={isActive}>
                    {item.label}
                  </DrawLine>
                </TransitionLink>
              );
            })}
          </nav>

          {/* Right CTA + Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <Button093 href="/tools">Browse Tools</Button093>
            </div>

            <button
              type="button"
              data-nav-toggle=""
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-drawer"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              className="md:hidden w-10 h-10 rounded-full border border-current/20 flex flex-col items-center justify-center gap-[6px] cursor-pointer"
            >
              <span ref={lineTopRef} className="w-5 h-[2px] bg-current rounded-full block" />
              <span ref={lineBotRef} className="w-5 h-[2px] bg-current rounded-full block" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        id="mobile-nav-drawer"
        ref={menuPanelRef}
        style={{ display: "none" }}
        className="md:hidden fixed top-[var(--nav-height)] left-0 right-0 bottom-0 h-[calc(100vh-var(--nav-height))] bg-[var(--swatch-dark-bg)] text-[var(--swatch-dark-ink)] z-40 overflow-y-auto"
      >
        <div className="padding-global py-8 flex flex-col gap-6">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-4 text-2xl font-bold">
            {NAV_LINKS.map((item) => (
              <TransitionLink
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="py-2 border-b border-white/10 no-underline text-inherit flex items-center justify-between"
              >
                <span>{item.label}</span>
                <span className="text-sm font-normal text-[var(--swatch-accent-glow)]">→</span>
              </TransitionLink>
            ))}
          </nav>

          <div className="pt-2">
            <Button093 href="/tools" onClick={() => setMenuOpen(false)}>
              Open All 16 Tools
            </Button093>
          </div>

          <p className="text-sm text-[var(--swatch-dark-muted)] leading-relaxed pt-4">
            100% browser-local utilities &amp; AI Prep tools. No account required, zero files uploaded.
          </p>
        </div>
      </div>
    </header>
  );
}
