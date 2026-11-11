import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getGuideBySlug, GUIDES } from "@/lib/content/guides";
import { getToolBySlug } from "@/lib/tools/registry";
import { Breadcrumbs } from "@/components/tools/seo/Breadcrumbs";
import { JsonLd } from "@/components/tools/seo/JsonLd";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return { title: "Guide Not Found" };
  return {
    title: `${guide.title} | Everyday Tools Hub`,
    description: guide.summary,
    alternates: { canonical: `/guides/${guide.slug}` },
  };
}

export default async function GuideDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const relatedTools = guide.relatedToolSlugs
    .map((s) => getToolBySlug(s))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.summary,
    dateModified: guide.updatedAt,
  };

  return (
    <div className="padding-global pt-[calc(var(--nav-height)+2rem)] pb-24">
      <JsonLd data={articleLd} />
      <article className="container-editorial max-w-4xl">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Guides", href: "/guides" },
            { label: guide.title },
          ]}
        />

        <p className="text-xs font-bold uppercase tracking-wider text-[var(--swatch-accent)] mb-2">
          {guide.categoryLabel} • {guide.readingMinutes} min read • Reviewed {guide.updatedAt}
        </p>
        <h1 className="heading-l text-[var(--theme-heading)]">{guide.title}</h1>
        <p className="mt-4 text-lg text-[var(--theme-text-muted)] leading-relaxed">{guide.summary}</p>

        <div className="mt-10 space-y-8 rounded-3xl bg-[var(--theme-surface)] border border-[var(--theme-border)] p-6 sm:p-10">
          {guide.sections.map((sec, idx) => (
            <section key={idx} className="space-y-3">
              <h2 className="text-xl font-bold text-[var(--theme-heading)]">{sec.heading}</h2>
              {sec.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="text-sm sm:text-base text-[var(--theme-text-muted)] leading-relaxed">
                  {p}
                </p>
              ))}
              {sec.bullets && (
                <ol className="list-decimal pl-5 space-y-2 text-sm sm:text-base text-[var(--theme-text-muted)] leading-relaxed">
                  {sec.bullets.map((b, bIdx) => (
                    <li key={bIdx}>{b}</li>
                  ))}
                </ol>
              )}
            </section>
          ))}
        </div>

        {relatedTools.length > 0 && (
          <section className="mt-10 space-y-4">
            <h2 className="text-lg font-bold">Tools Referenced in This Guide</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedTools.map((tool) => (
                <Link
                  key={tool.id}
                  href={`/tools/${tool.slug}`}
                  className="rounded-2xl p-5 bg-[var(--theme-surface)] border border-[var(--theme-border)] hover:border-[var(--swatch-accent)] no-underline text-[var(--theme-text)] flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-bold text-sm">{tool.name}</p>
                    <p className="text-xs text-[var(--theme-text-muted)] mt-0.5 line-clamp-1">
                      {tool.shortDescription}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 shrink-0 text-[var(--swatch-accent)]" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}

