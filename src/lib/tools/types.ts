export type ToolCategory =
  | "image-tools"
  | "pdf-tools"
  | "text-tools"
  | "developer-tools"
  | "qr-tools"
  | "date-calculators"
  | "ai-prep-tools";

export type AccuracyKind = "exact" | "estimated" | "heuristic";

export type ToolProcessingMode = "local" | "local-model";

export type ThemeVariant =
  | "theme-accent"
  | "theme-coral"
  | "theme-volt"
  | "theme-sky"
  | "theme-mint";

export type ToolState =
  | "idle"
  | "selected"
  | "validating"
  | "processing"
  | "success"
  | "partial-success"
  | "error"
  | "cancelled";

export interface ToolAuditRecord {
  verifiedAt: string;
  method: "network-inspection";
  by: string;
  note?: string;
}

export interface DataAssetMeta {
  name: string;
  reviewedAt: string;
  maxAgeDays: number;
  sourceUrl: string;
}

export interface ModelAssetMeta {
  id: string;
  bytes: number;
  license: string;
  licenseReviewedAt: string;
}

export interface ToolFAQ {
  question: string;
  answer: string;
}

export interface ToolDefinition {
  id: string;
  slug: string;
  category: ToolCategory;
  wave: 0 | 1 | 2 | 3;
  name: string;
  shortDescription: string;
  title: string;
  metaDescription: string;
  outcomeStatement: string;
  status: "draft" | "published";
  processing: ToolProcessingMode;
  audit?: ToolAuditRecord;
  accuracy: AccuracyKind;
  accuracyNote: string;
  dataAsset?: DataAssetMeta;
  modelAsset?: ModelAssetMeta;
  relatedToolIds: readonly string[];
  acceptedMimeTypes?: readonly string[];
  maxFileBytes?: number;
  maxFileLabel?: string;
  supportedFormats: readonly string[];
  limitations: readonly string[];
  instructions: readonly string[];
  faqs: readonly ToolFAQ[];
  themeVariant: ThemeVariant;
  featured?: boolean;
  keywords: readonly string[];
}

export interface CategoryMeta {
  slug: ToolCategory;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  guidance: string;
  themeVariant: ThemeVariant;
  accentHex: string;
  guideSlugs: readonly string[];
}

