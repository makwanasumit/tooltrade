import React from "react";
import Link from "next/link";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import type { ToolDefinition } from "@/lib/tools/types";

export function VerifiedLocalBadge({ tool }: { tool: ToolDefinition }) {
  const isVerified = Boolean(tool.audit && !tool.audit.by.includes("pending"));

  if (!isVerified || !tool.audit) {
    return (
      <Link
        href="/guides/verify-local-processing"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border no-underline bg-[var(--theme-surface-muted)] border-[var(--theme-border)] text-[var(--theme-text-muted)]"
      >
        <ShieldAlert className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Local execution • Network audit pending</span>
      </Link>
    );
  }

  return (
    <Link
      href="/guides/verify-local-processing"
      title={`Verified by ${tool.audit.method} on ${tool.audit.verifiedAt}`}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border no-underline transition-opacity hover:opacity-90"
      style={{
        color: "var(--status-verified-fg)",
        backgroundColor: "var(--status-verified-bg)",
        borderColor: "var(--status-verified-border)",
      }}
    >
      <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>Runs on your device • Audited {tool.audit.verifiedAt}</span>
    </Link>
  );
}

