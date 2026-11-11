import React from "react";
import Link from "next/link";
import { Button052 } from "@/components/ui/Button052";

export default function NotFound() {
  return (
    <div className="padding-global pt-[calc(var(--nav-height)+4rem)] pb-28">
      <div className="container-editorial max-w-2xl text-center space-y-5">
        <p className="eyebrow-m">404 — Page Not Found</p>
        <h1 className="heading-xl text-[var(--theme-heading)]">Tool not found.</h1>
        <p className="text-base text-[var(--theme-text-muted)]">
          The page you looked for moved or does not exist. Jump back to the directory to browse all
          16 browser-local tools.
        </p>
        <div className="pt-2 flex flex-wrap justify-center gap-4">
          <Button052 href="/tools">Browse All Tools</Button052>
          <Link
            href="/"
            className="px-5 py-3 rounded-full border border-[var(--theme-border)] text-sm font-semibold no-underline text-[var(--theme-text)]"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

