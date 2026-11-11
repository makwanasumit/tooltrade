import React from "react";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/tools/seo/Breadcrumbs";

export const metadata: Metadata = {
  title: "Cookie Preferences | Everyday Tools Hub",
  description: "Current cookie and storage status on Everyday Tools Hub.",
  alternates: { canonical: "/cookie-preferences" },
};

export default function CookiePreferencesPage() {
  return (
    <div className="padding-global pt-[calc(var(--nav-height)+2rem)] pb-24">
      <div className="container-editorial max-w-3xl space-y-6">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Cookie Preferences" }]} />
        <h1 className="heading-l text-[var(--theme-heading)]">Cookie Preferences</h1>
        <div className="rounded-3xl bg-[var(--theme-surface)] border border-[var(--theme-border)] p-6 sm:p-8 space-y-4 text-sm sm:text-base text-[var(--theme-text-muted)] leading-relaxed">
          <p>
            Everyday Tools Hub currently operates without advertising cookies or third-party
            tracking cookies. Tool inputs and outputs are kept strictly in browser memory.
          </p>
          <p>
            If optional advertising or consent-gated analytics vendors are enabled in the future,
            interactive consent and opt-out controls will appear directly on this page before any
            non-essential cookies are set.
          </p>
        </div>
      </div>
    </div>
  );
}

