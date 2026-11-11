import React from "react";
import type { Metadata } from "next";
import { ToolDirectoryClient } from "@/components/tools/ToolDirectoryClient";
import { Breadcrumbs } from "@/components/tools/seo/Breadcrumbs";

export const metadata: Metadata = {
  title: "All Online Tools (12 Core + 4 AI Prep) | Everyday Tools Hub",
  description:
    "Browse all 16 browser-local tools across images, PDFs, text, JSON, QR codes, date math, and AI Prep.",
  alternates: { canonical: "/tools" },
};

export default function ToolsDirectoryPage() {
  return (
    <div className="padding-global pt-[calc(var(--nav-height)+2rem)] pb-24">
      <div className="container-editorial">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "All Tools" }]} />
        <div className="mb-10 max-w-3xl">
          <p className="eyebrow-m mb-2">Directory</p>
          <h1 className="heading-xl text-[var(--theme-heading)]">All Tools</h1>
          <p className="mt-3 text-base sm:text-lg text-[var(--theme-text-muted)]">
            Filter by file format, task, or category. Every utility below runs locally in your
            browser without accounts.
          </p>
        </div>

        <ToolDirectoryClient />
      </div>
    </div>
  );
}

