"use client";

import React, { useEffect, useState } from "react";
import { CalendarClock, AlertTriangle, ExternalLink } from "lucide-react";
import { trackToolEvent } from "@/lib/analytics/tracker";

interface DataFreshnessBannerProps {
  assetName: string;
  reviewedAt: string;
  maxAgeDays: number;
  sourceUrl?: string;
}

export function DataFreshnessBanner({
  assetName,
  reviewedAt,
  maxAgeDays,
  sourceUrl,
}: DataFreshnessBannerProps) {
  const [ageInfo, setAgeInfo] = useState<{ ageDays: number; isStale: boolean }>({
    ageDays: 0,
    isStale: false,
  });

  useEffect(() => {
    const parsed = Date.parse(`${reviewedAt}T00:00:00Z`);
    const ageDays = Number.isNaN(parsed)
      ? 999
      : Math.max(0, Math.floor((Date.now() - parsed) / 86_400_000));
    const isStale = ageDays > maxAgeDays;
    // Update asynchronously in microtask/callback to satisfy react-hooks/set-state-in-effect
    const id = requestAnimationFrame(() => {
      setAgeInfo({ ageDays, isStale });
      if (isStale) {
        trackToolEvent("stale_data_view", {
          data_asset_name: assetName,
          age_bucket: "stale",
        });
      }
    });
    return () => cancelAnimationFrame(id);
  }, [assetName, reviewedAt, maxAgeDays]);

  return (
    <div
      className="rounded-xl px-4 py-3 text-xs border flex flex-wrap items-center justify-between gap-2"
      style={
        ageInfo.isStale
          ? {
              backgroundColor: "var(--status-estimated-bg)",
              borderColor: "var(--status-estimated-border)",
              color: "var(--status-estimated-fg)",
            }
          : {
              backgroundColor: "var(--theme-surface-muted)",
              borderColor: "var(--theme-border)",
              color: "var(--theme-text-muted)",
            }
      }
    >
      <div className="flex items-center gap-2 font-medium">
        {ageInfo.isStale ? (
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
        ) : (
          <CalendarClock className="w-4 h-4 shrink-0" aria-hidden="true" />
        )}
        <span>
          {ageInfo.isStale
            ? `Pricing & context data was last reviewed on ${reviewedAt} (${ageInfo.ageDays} days ago — verify vendor rates before billing decisions).`
            : `Model limits & pricing reviewed on ${reviewedAt} (checked every ${maxAgeDays} days).`}
        </span>
      </div>
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-semibold underline"
        >
          <span>Vendor pricing</span>
          <ExternalLink className="w-3 h-3" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
