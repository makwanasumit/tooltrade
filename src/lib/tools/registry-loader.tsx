"use client";

import React from "react";
import dynamic from "next/dynamic";

function ToolWorkspaceSkeleton() {
  return (
    <div className="py-12 flex flex-col items-center justify-center text-sm text-[var(--theme-text-muted)] gap-2">
      <div className="w-8 h-8 rounded-full border-2 border-[var(--swatch-accent)] border-t-transparent animate-spin" />
      <span>Loading local browser workspace...</span>
    </div>
  );
}

const TOOL_COMPONENTS: Record<string, React.ComponentType> = {
  "image-compressor": dynamic(
    () =>
      import("@/features/image-tools/ImageCompressorTool").then(
        (m) => m.ImageCompressorTool,
      ),
    { loading: () => <ToolWorkspaceSkeleton /> },
  ),
  "image-converter": dynamic(
    () =>
      import("@/features/image-tools/ImageConverterTool").then((m) => m.ImageConverterTool),
    { loading: () => <ToolWorkspaceSkeleton /> },
  ),
  "image-resizer": dynamic(
    () => import("@/features/image-tools/ImageResizerTool").then((m) => m.ImageResizerTool),
    { loading: () => <ToolWorkspaceSkeleton /> },
  ),
  "photo-signature-resizer": dynamic(
    () =>
      import("@/features/image-tools/PhotoSignatureResizerTool").then(
        (m) => m.PhotoSignatureResizerTool,
      ),
    { loading: () => <ToolWorkspaceSkeleton /> },
  ),
  "merge-pdf": dynamic(
    () => import("@/features/pdf-tools/MergePdfTool").then((m) => m.MergePdfTool),
    { loading: () => <ToolWorkspaceSkeleton /> },
  ),
  "split-pdf": dynamic(
    () => import("@/features/pdf-tools/SplitPdfTool").then((m) => m.SplitPdfTool),
    { loading: () => <ToolWorkspaceSkeleton /> },
  ),
  "jpg-to-pdf": dynamic(
    () => import("@/features/pdf-tools/JpgToPdfTool").then((m) => m.JpgToPdfTool),
    { loading: () => <ToolWorkspaceSkeleton /> },
  ),
  "word-counter": dynamic(
    () => import("@/features/text-tools/WordCounterTool").then((m) => m.WordCounterTool),
    { loading: () => <ToolWorkspaceSkeleton /> },
  ),
  "json-formatter": dynamic(
    () =>
      import("@/features/json-tools/JsonFormatterTool").then((m) => m.JsonFormatterTool),
    { loading: () => <ToolWorkspaceSkeleton /> },
  ),
  "qr-code-generator": dynamic(
    () => import("@/features/qr-tools/QrGeneratorTool").then((m) => m.QrGeneratorTool),
    { loading: () => <ToolWorkspaceSkeleton /> },
  ),
  "age-calculator": dynamic(
    () => import("@/features/date-tools/AgeCalculatorTool").then((m) => m.AgeCalculatorTool),
    { loading: () => <ToolWorkspaceSkeleton /> },
  ),
  "date-difference-calculator": dynamic(
    () =>
      import("@/features/date-tools/DateDifferenceTool").then((m) => m.DateDifferenceTool),
    { loading: () => <ToolWorkspaceSkeleton /> },
  ),
  "llm-json-repair": dynamic(
    () =>
      import("@/features/ai-prep/json-repair/LlmJsonRepairTool").then(
        (m) => m.LlmJsonRepairTool,
      ),
    { loading: () => <ToolWorkspaceSkeleton /> },
  ),
  "pii-redactor": dynamic(
    () =>
      import("@/features/ai-prep/redactor/PiiRedactorTool").then((m) => m.PiiRedactorTool),
    { loading: () => <ToolWorkspaceSkeleton /> },
  ),
  "token-counter": dynamic(
    () =>
      import("@/features/ai-prep/tokens/TokenCounterTool").then((m) => m.TokenCounterTool),
    { loading: () => <ToolWorkspaceSkeleton /> },
  ),
  "hidden-text-scanner": dynamic(
    () =>
      import("@/features/ai-prep/hidden-text/HiddenTextScannerTool").then(
        (m) => m.HiddenTextScannerTool,
      ),
    { loading: () => <ToolWorkspaceSkeleton /> },
  ),
};

export function ToolClientLoader({ toolId }: { toolId: string }) {
  const Component = TOOL_COMPONENTS[toolId];
  if (!Component) {
    return <p className="text-sm text-[var(--status-finding-fg)]">Tool component unavailable.</p>;
  }
  return <Component />;
}

