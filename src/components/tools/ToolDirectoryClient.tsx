"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { CATEGORIES, TOOLS_REGISTRY } from "@/lib/tools/registry";
import type { ToolCategory } from "@/lib/tools/types";
import { AccuracyBadge } from "./badges/AccuracyBadge";

export function ToolDirectoryClient() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOOLS_REGISTRY.filter((t) => {
      if (t.status !== "published") return false;
      if (selectedCategory !== "all" && t.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.shortDescription.toLowerCase().includes(q) ||
        t.keywords.some((k) => k.includes(q))
      );
    });
  }, [query, selectedCategory]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="relative flex-1 max-w-xl">
          <label htmlFor="dir-search" className="sr-only">
            Filter tools
          </label>
          <Search
            className="w-4 h-4 text-[var(--theme-text-muted)] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="dir-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by task, file format, or keyword..."
            className="tool-input !rounded-full pl-11 pr-4 py-3"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-3.5 py-2 rounded-full text-xs font-semibold cursor-pointer ${
              selectedCategory === "all"
                ? "bg-[var(--swatch-ink)] text-white border-[1.5px] border-[var(--swatch-ink)]"
                : "bg-[var(--theme-surface)] border-[1.5px] border-[var(--swatch-ink)] hover:bg-[var(--swatch-volt)]"
            }`}
          >
            All ({TOOLS_REGISTRY.length})
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold cursor-pointer ${
                selectedCategory === cat.slug
                  ? "bg-[var(--swatch-ink)] text-white border-[1.5px] border-[var(--swatch-ink)]"
                  : "bg-[var(--theme-surface)] border-[1.5px] border-[var(--swatch-ink)] hover:bg-[var(--swatch-volt)]"
              }`}
            >
              {cat.shortName}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="tool-info !p-10 text-center space-y-3">
          <p className="font-semibold text-base">No tools matched &ldquo;{query}&rdquo;.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSelectedCategory("all");
            }}
            className="tool-btn tool-btn--sm"
          >
            Show all tools
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((tool) => (
            <Link
              key={tool.id}
              href={`/tools/${tool.slug}`}
              data-cursor-marquee-text="Open tool →"
              className="tool-next !p-6 no-underline text-[var(--theme-text)] flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--theme-surface-muted)]">
                    {tool.wave === 1 ? "AI Prep" : "Core Tool"}
                  </span>
                  <AccuracyBadge kind={tool.accuracy} asStatic />
                </div>
                <h2 className="text-lg font-bold">{tool.name}</h2>
                <p className="mt-1.5 text-sm text-[var(--theme-text-muted)] leading-relaxed">
                  {tool.shortDescription}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--swatch-accent)]">
                Launch workspace <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

