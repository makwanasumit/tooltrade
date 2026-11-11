export type AnalyticsEventName =
  | "tool_view"
  | "tool_start"
  | "tool_success"
  | "tool_error"
  | "download"
  | "copy_result"
  | "related_tool_click"
  | "detector_run"
  | "ai_prep_cross_use"
  | "stale_data_view";

const FORBIDDEN_KEYS = new Set([
  "text",
  "content",
  "input",
  "output",
  "payload",
  "filename",
  "fileName",
  "findings",
  "mapping",
  "qr",
  "gps",
  "email",
  "phone",
]);

export interface SafeAnalyticsProperties {
  tool_id?: string;
  category?: string;
  source_tool_id?: string;
  destination_tool_id?: string;
  finding_count_bucket?: "none" | "1-5" | "6+";
  detector_set_version?: string;
  data_asset_name?: string;
  age_bucket?: "fresh" | "warn" | "stale";
  error_code?: string;
  duration_ms_bucket?: "<100ms" | "100-500ms" | "500-2000ms" | ">2000ms";
  output_format?: string;
}

export function sanitizeAnalyticsPayload(
  props: Record<string, unknown>,
): SafeAnalyticsProperties {
  const clean: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(props)) {
    if (FORBIDDEN_KEYS.has(key)) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      clean[key] = value;
    }
  }
  return clean as SafeAnalyticsProperties;
}

export function trackToolEvent(
  event: AnalyticsEventName,
  properties: SafeAnalyticsProperties,
): void {
  if (typeof window === "undefined") return;
  const safeProps = sanitizeAnalyticsPayload(properties as Record<string, unknown>);
  // Zero-network local event dispatch for observability without leaking user data
  window.dispatchEvent(
    new CustomEvent("eth:analytics", {
      detail: { event, properties: safeProps, ts: Date.now() },
    }),
  );
}

export function bucketDuration(ms: number): SafeAnalyticsProperties["duration_ms_bucket"] {
  if (ms < 100) return "<100ms";
  if (ms < 500) return "100-500ms";
  if (ms < 2000) return "500-2000ms";
  return ">2000ms";
}

export function bucketFindingCount(count: number): "none" | "1-5" | "6+" {
  if (count <= 0) return "none";
  if (count <= 5) return "1-5";
  return "6+";
}

