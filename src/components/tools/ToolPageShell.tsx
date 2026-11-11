import React from "react";
import Link from "next/link";
import { ArrowRight, Info, ListChecks, AlertTriangle, HelpCircle } from "lucide-react";
import type { ToolDefinition } from "@/lib/tools/types";
import { getCategoryBySlug, getRelatedTools } from "@/lib/tools/registry";
import { Breadcrumbs } from "@/components/tools/seo/Breadcrumbs";
import { JsonLd } from "@/components/tools/seo/JsonLd";
import { VerifiedLocalBadge } from "@/components/tools/badges/VerifiedLocalBadge";
import { AccuracyBadge } from "@/components/tools/badges/AccuracyBadge";
import { AdSlot } from "@/components/tools/ads/AdSlot";
import { ToolFlowProvider, ToolStepper } from "@/components/tools/workspace/ToolFlow";

interface ToolPageShellProps {
  tool: ToolDefinition;
  children: React.ReactNode;
}

export function ToolPageShell({ tool, children }: ToolPageShellProps) {
  const category = getCategoryBySlug(tool.category);
  const relatedTools = getRelatedTools(tool);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "/" },
      {
        "@type": "ListItem",
        position: 2,
        name: category?.name ?? "Tools",
        item: `/categories/${tool.category}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: tool.name,
        item: `/tools/${tool.slug}`,
      },
    ],
  };

  const appJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    applicationCategory: "UtilityApplication",
    operatingSystem: "Web Browser",
    description: tool.shortDescription,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <div
      data-tool-workspace=""
      className="padding-global pt-[calc(var(--nav-height)+1.75rem)] pb-20"
    >
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={appJsonLd} />

      <div className="container-workspace">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: category?.name ?? "Tools", href: `/categories/${tool.category}` },
            { label: tool.name },
          ]}
        />

        {/* Intro Header — instant visibility, zero blocking motion */}
        <div className="mb-7 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <VerifiedLocalBadge tool={tool} />
              <AccuracyBadge kind={tool.accuracy} />
            </div>

            <h1 className="heading-l text-[var(--theme-heading)]">{tool.name}</h1>
            <p className="mt-3 text-base sm:text-lg text-[var(--theme-text-muted)] leading-relaxed">
              {tool.outcomeStatement}
            </p>
          </div>
        </div>

        <ToolFlowProvider>
          <div className="mb-4">
            <ToolStepper steps={tool.instructions} />
          </div>

          {/* Interactive Tool Workspace (task first — above the fold) */}
          <section
            aria-label={`${tool.name} workspace`}
            className="tool-workspace rounded-[var(--radius-xl)] bg-[var(--theme-surface)] p-5 sm:p-8"
          >
            {children}
          </section>
        </ToolFlowProvider>

        {/* AdSlot strictly placed outside interactive workspace & review panels */}
        <AdSlot slotId={`tool-${tool.id}-below`} placement="below-tool" />

        {/* Trust, Accuracy & Limits Row */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="tool-info">
            <h2 className="text-base font-bold flex items-center gap-2 text-[var(--theme-heading)]">
              <Info className="w-4 h-4 text-[var(--swatch-accent)]" aria-hidden="true" />
              <span>Supported Formats, Limits &amp; Accuracy</span>
            </h2>
            <p className="mt-2 text-sm text-[var(--theme-text-muted)] leading-relaxed">
              {tool.accuracyNote}
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex flex-wrap gap-2">
                <dt className="font-semibold text-[var(--theme-text)]">Supported:</dt>
                <dd className="text-[var(--theme-text-muted)]">{tool.supportedFormats.join(", ")}</dd>
              </div>
              {tool.maxFileLabel && (
                <div className="flex flex-wrap gap-2">
                  <dt className="font-semibold text-[var(--theme-text)]">Configured limit:</dt>
                  <dd className="text-[var(--theme-text-muted)]">{tool.maxFileLabel}</dd>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <dt className="font-semibold text-[var(--theme-text)]">Processing:</dt>
                <dd className="text-[var(--theme-text-muted)]">
                  Client-side browser execution ({" "}
                  <Link href="/guides/verify-local-processing" className="text-[var(--swatch-accent)] underline">
                    how to verify
                  </Link>
                  )
                </dd>
              </div>
            </dl>
          </section>

          <section className="tool-info">
            <h2 className="text-base font-bold flex items-center gap-2 text-[var(--theme-heading)]">
              <AlertTriangle className="w-4 h-4 text-[var(--swatch-coral)]" aria-hidden="true" />
              <span>Honest Limitations</span>
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-[var(--theme-text-muted)] list-disc pl-5 leading-relaxed">
              {tool.limitations.map((lim, i) => (
                <li key={i}>{lim}</li>
              ))}
            </ul>
          </section>
        </div>

        {/* Instructions & FAQs */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="tool-info">
            <h2 className="text-base font-bold flex items-center gap-2 text-[var(--theme-heading)]">
              <ListChecks className="w-4 h-4 text-[var(--swatch-accent)]" aria-hidden="true" />
              <span>How to Use {tool.name}</span>
            </h2>
            <ol className="mt-3 space-y-2.5 text-sm text-[var(--theme-text-muted)] list-decimal pl-5 leading-relaxed">
              {tool.instructions.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </section>

          <section className="tool-info">
            <h2 className="text-base font-bold flex items-center gap-2 text-[var(--theme-heading)]">
              <HelpCircle className="w-4 h-4 text-[var(--swatch-sky)]" aria-hidden="true" />
              <span>Frequently Asked Questions</span>
            </h2>
            <dl className="mt-3 space-y-4 text-sm">
              {tool.faqs.map((faq, i) => (
                <div key={i}>
                  <dt className="font-semibold text-[var(--theme-text)]">{faq.question}</dt>
                  <dd className="mt-1 text-[var(--theme-text-muted)] leading-relaxed">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        {/* Cross-Linked Related Tools (PRD v2 §6.4) */}
        {relatedTools.length > 0 && (
          <section aria-label="Related tools" className="mt-10">
            <h2 className="text-lg font-bold text-[var(--theme-heading)] mb-4">
              Next Steps &amp; Related Tools
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedTools.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/tools/${rel.slug}`}
                  className="tool-next no-underline text-[var(--theme-text)] flex flex-col justify-between gap-3"
                >
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--swatch-accent)]">
                      {rel.wave === 1 ? "AI Prep" : "Core Tool"}
                    </span>
                    <h3 className="text-base font-bold mt-1">{rel.name}</h3>
                    <p className="text-xs text-[var(--theme-text-muted)] mt-1 leading-relaxed">
                      {rel.shortDescription}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--swatch-accent)]">
                    Open tool <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

