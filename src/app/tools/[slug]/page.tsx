import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getToolBySlug, TOOLS_REGISTRY } from "@/lib/tools/registry";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { ToolClientLoader } from "@/lib/tools/registry-loader";

export function generateStaticParams() {
  return TOOLS_REGISTRY.filter((t) => t.status === "published").map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return { title: "Tool Not Found" };
  return {
    title: tool.title,
    description: tool.metaDescription,
    alternates: { canonical: `/tools/${tool.slug}` },
  };
}

export default async function ToolSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();

  return (
    <ToolPageShell tool={tool}>
      <ToolClientLoader toolId={tool.id} />
    </ToolPageShell>
  );
}

