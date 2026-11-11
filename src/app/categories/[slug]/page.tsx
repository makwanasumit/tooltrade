import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  CATEGORIES,
  getCategoryBySlug,
  getToolsByCategory,
} from "@/lib/tools/registry";
import { GUIDES } from "@/lib/content/guides";
import { Breadcrumbs } from "@/components/tools/seo/Breadcrumbs";
import { AccuracyBadge } from "@/components/tools/badges/AccuracyBadge";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = getCategoryBySlug(slug);
  if (!cat) return { title: "Category Not Found" };
  return {
    title: `${cat.name} — Browser-Local Utilities | Everyday Tools Hub`,
    description: cat.description,
    alternates: { canonical: `/categories/${cat.slug}` },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = getCategoryBySlug(slug);
  if (!cat) notFound();

  const tools = getToolsByCategory(cat.slug);
  const relatedGuides = GUIDES.filter((g) => cat.guideSlugs.includes(g.slug));

  return (
    <div className="padding-global pt-[calc(var(--nav-height)+2rem)] pb-24">
      <div className="container-editorial space-y-12">
        <div>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Tools", href: "/tools" },
              { label: cat.name },
            ]}
          />

          <div className={`rounded-3xl p-8 sm:p-12 border border-black/10 ${cat.themeVariant}`}>
            <p className="text-xs font-bold uppercase tracking-wider opacity-75 mb-2">
              Category • {tools.length} Local {tools.length === 1 ? "Tool" : "Tools"}
            </p>
            <h1 className="heading-xl">{cat.name}</h1>
            <p className="mt-4 text-base sm:text-lg max-w-2xl opacity-90 leading-relaxed">
              {cat.description}
            </p>
          </div>
        </div>

        {/* Tools in Category */}
        <section aria-label={`${cat.name} tools`} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={`/tools/${tool.slug}`}
              data-cursor-marquee-text="Open tool →"
              className="tool-next !p-6 no-underline text-[var(--theme-text)] flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <AccuracyBadge kind={tool.accuracy} asStatic />
                  <span className="text-xs font-mono text-[var(--theme-text-muted)]">
                    {tool.supportedFormats.slice(0, 3).join(" • ")}
                  </span>
                </div>
                <h2 className="text-xl font-bold">{tool.name}</h2>
                <p className="mt-2 text-sm text-[var(--theme-text-muted)] leading-relaxed">
                  {tool.shortDescription}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--swatch-accent)]">
                Launch {tool.name} <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </section>

        {/* Selection Guidance */}
        <section className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 sm:p-8 space-y-2">
          <h2 className="text-lg font-bold">How to Choose the Right Tool</h2>
          <p className="text-sm sm:text-base text-[var(--theme-text-muted)] leading-relaxed">
            {cat.guidance}
          </p>
        </section>

        {/* Relevant Guides */}
        {relatedGuides.length > 0 && (
          <section aria-label="Relevant guides" className="space-y-4">
            <h2 className="text-lg font-bold">Related Guides</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedGuides.map((g) => (
                <Link
                  key={g.slug}
                  href={`/guides/${g.slug}`}
                  className="rounded-2xl p-5 bg-[var(--theme-surface)] border border-[var(--theme-border)] hover:border-[var(--swatch-accent)] no-underline text-[var(--theme-text)]"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--swatch-accent)]">
                    {g.categoryLabel}
                  </p>
                  <h3 className="text-base font-bold mt-1">{g.title}</h3>
                  <p className="text-xs text-[var(--theme-text-muted)] mt-1">{g.summary}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

