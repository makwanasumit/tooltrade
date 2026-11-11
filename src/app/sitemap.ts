import type { MetadataRoute } from "next";
import { CATEGORIES, TOOLS_REGISTRY } from "@/lib/tools/registry";
import { GUIDES } from "@/lib/content/guides";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://everyday-tools.example";
  const now = new Date();

  const staticPages = [
    "",
    "/tools",
    "/guides",
    "/accuracy",
    "/about",
    "/contact",
    "/privacy-policy",
    "/terms",
    "/accessibility",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
  }));

  const categoryPages = CATEGORIES.map((c) => ({
    url: `${baseUrl}/categories/${c.slug}`,
    lastModified: now,
  }));

  const toolPages = TOOLS_REGISTRY.filter((t) => t.status === "published").map((t) => ({
    url: `${baseUrl}/tools/${t.slug}`,
    lastModified: now,
  }));

  const guidePages = GUIDES.map((g) => ({
    url: `${baseUrl}/guides/${g.slug}`,
    lastModified: now,
  }));

  return [...staticPages, ...categoryPages, ...toolPages, ...guidePages];
}

