import React from "react";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/tools/seo/Breadcrumbs";

export const metadata: Metadata = {
  title: "Accessibility Statement | Everyday Tools Hub",
  description: "WCAG 2.2 AA commitments, keyboard controls, reduced-motion support, and feedback contact.",
  alternates: { canonical: "/accessibility" },
};

export default function AccessibilityPage() {
  return (
    <div className="padding-global pt-[calc(var(--nav-height)+2rem)] pb-24">
      <div className="container-editorial max-w-4xl space-y-6">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Accessibility" }]} />
        <h1 className="heading-l text-[var(--theme-heading)]">Accessibility Statement</h1>
        <div className="rounded-3xl bg-[var(--theme-surface)] border border-[var(--theme-border)] p-6 sm:p-10 space-y-4 text-sm sm:text-base text-[var(--theme-text-muted)] leading-relaxed">
          <p>
            We design Everyday Tools Hub toward WCAG 2.2 Level AA across desktop and mobile
            viewports:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Every form input, file picker, and file reorder list is keyboard operable.</li>
            <li>
              Status badges (Exact, Estimated, Heuristic, Verified Local) pair color with icons and
              explicit text labels.
            </li>
            <li>
              Setting <code>prefers-reduced-motion: reduce</code> in your OS disables smooth
              scrolling, cursor marquees, sticker trails, and split-text entrance motion.
            </li>
            <li>Tool state announcements use polite ARIA live regions without flooding screen readers.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

