"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { SplitText } from "gsap/SplitText";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { InertiaPlugin } from "gsap/InertiaPlugin";

if (typeof window !== "undefined") {
  gsap.registerPlugin(CustomEase, SplitText, DrawSVGPlugin, ScrollTrigger, InertiaPlugin);
  try {
    CustomEase.create("osmo", "0.625, 0.05, 0, 1");
  } catch {
    // Ignore if already registered during HMR
  }
}

interface MotionContextValue {
  reducedMotion: boolean;
  isDesktopFinePointer: boolean;
  pauseScroll: () => void;
  resumeScroll: () => void;
  scrollToTop: () => void;
  navigateWithTransition: (href: string) => void;
  isTransitioning: boolean;
}

const MotionContext = createContext<MotionContextValue>({
  reducedMotion: false,
  isDesktopFinePointer: false,
  pauseScroll: () => {},
  resumeScroll: () => {},
  scrollToTop: () => {},
  navigateWithTransition: () => {},
  isTransitioning: false,
});

export function useMotion() {
  return useContext(MotionContext);
}

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isDesktopFinePointer, setIsDesktopFinePointer] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionLockRef = useRef(false);

  useEffect(() => {
    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointerMq = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 992px)");

    const update = () => {
      setReducedMotion(motionMq.matches);
      setIsDesktopFinePointer(pointerMq.matches && !motionMq.matches);
    };
    update();

    motionMq.addEventListener("change", update);
    pointerMq.addEventListener("change", update);
    return () => {
      motionMq.removeEventListener("change", update);
      pointerMq.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      lenisRef.current?.destroy();
      lenisRef.current = null;
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;
    (window as unknown as { lenis?: Lenis }).lenis = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reducedMotion]);

  // Reset scroll & refresh triggers cleanly on route navigation
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
    const id = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  const pauseScroll = useCallback(() => {
    lenisRef.current?.stop();
  }, []);

  const resumeScroll = useCallback(() => {
    lenisRef.current?.start();
  }, []);

  const scrollToTop = useCallback(() => {
    if (lenisRef.current && !reducedMotion) {
      lenisRef.current.scrollTo(0, { duration: 1.2 });
    } else {
      window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    }
  }, [reducedMotion]);

  const navigateWithTransition = useCallback(
    (href: string) => {
      if (href === pathname || href.startsWith("#")) {
        if (href.startsWith("#")) {
          const target = document.querySelector(href);
          if (target instanceof HTMLElement) {
            lenisRef.current?.scrollTo(target, { offset: -80 });
          }
        }
        return;
      }

      // Utility Speed Rule: never delay direct tool workspace entry or reduced-motion users
      const isDirectToolWorkspace = href.startsWith("/tools/") && href !== "/tools";
      if (reducedMotion || isDirectToolWorkspace || transitionLockRef.current) {
        router.push(href);
        return;
      }

      transitionLockRef.current = true;
      setIsTransitioning(true);

      window.dispatchEvent(
        new CustomEvent("eth:route-transition", {
          detail: {
            phase: "leave",
            onMidpoint: () => {
              router.push(href);
            },
            onComplete: () => {
              transitionLockRef.current = false;
              setIsTransitioning(false);
            },
          },
        }),
      );
    },
    [pathname, reducedMotion, router],
  );

  const value = useMemo<MotionContextValue>(
    () => ({
      reducedMotion,
      isDesktopFinePointer,
      pauseScroll,
      resumeScroll,
      scrollToTop,
      navigateWithTransition,
      isTransitioning,
    }),
    [
      reducedMotion,
      isDesktopFinePointer,
      pauseScroll,
      resumeScroll,
      scrollToTop,
      navigateWithTransition,
      isTransitioning,
    ],
  );

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

