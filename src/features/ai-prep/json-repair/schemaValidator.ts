import { Validator, type Schema } from "@cfworker/json-schema";

const SUPPORTED_KEYWORDS = new Set([
  "$schema",
  "$id",
  "$defs",
  "definitions",
  "title",
  "description",
  "default",
  "examples",
  "type",
  "properties",
  "required",
  "enum",
  "const",
  "items",
  "prefixItems",
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "minLength",
  "maxLength",
  "minItems",
  "maxItems",
  "uniqueItems",
  "pattern",
  "oneOf",
  "anyOf",
  "allOf",
  "not",
  "additionalProperties",
]);

function collectUnsupportedKeywords(node: unknown, out: Set<string>): void {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach((item) => collectUnsupportedKeywords(item, out));
    return;
  }

  for (const [key, val] of Object.entries(node as Record<string, unknown>)) {
    if (!SUPPORTED_KEYWORDS.has(key)) {
      // Skip user property names inside `properties` or `$defs` map
      out.add(key);
    }
    if (key === "properties" || key === "$defs" || key === "definitions") {
      if (val && typeof val === "object" && !Array.isArray(val)) {
        Object.values(val as Record<string, unknown>).forEach((sub) =>
          collectUnsupportedKeywords(sub, out),
        );
      }
    } else if (typeof val === "object" && val !== null) {
      collectUnsupportedKeywords(val, out);
    }
  }
}

export interface SchemaValidationErrorItem {
  instanceLocation: string;
  keywordLocation: string;
  error: string;
}

export interface SchemaValidationSummary {
  valid: boolean;
  schemaParseError?: string;
  unsupportedKeywords: string[];
  errors: SchemaValidationErrorItem[];
}

export function validateAgainstJsonSchema(
  jsonValue: unknown,
  schemaText: string,
): SchemaValidationSummary {
  let schemaObj: Schema;
  try {
    const parsed = JSON.parse(schemaText);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        valid: false,
        schemaParseError: "JSON Schema must be a JSON object.",
        unsupportedKeywords: [],
        errors: [],
      };
    }
    schemaObj = parsed as Schema;
  } catch (err) {
    return {
      valid: false,
      schemaParseError: err instanceof Error ? err.message : "Invalid schema JSON.",
      unsupportedKeywords: [],
      errors: [],
    };
  }

  const unsupported = new Set<string>();
  collectUnsupportedKeywords(schemaObj, unsupported);

  const validator = new Validator(schemaObj, "2020-12", false);
  const result = validator.validate(jsonValue);

  return {
    valid: result.valid,
    unsupportedKeywords: Array.from(unsupported),
    errors: result.errors.map((e) => ({
      instanceLocation: e.instanceLocation || "#",
      keywordLocation: e.keywordLocation,
      error: e.error,
    })),
  };
}

export function buildFixPrompt(
  errors: readonly SchemaValidationErrorItem[],
  truncated: boolean,
): string {
  const lines = [
    "Your previous JSON output had issues. Return valid RFC 8259 JSON only (no markdown code fences or prose).",
  ];
  if (truncated) {
    lines.push("- The previous response appeared truncated mid-output. Re-emit the complete JSON.");
  }
  if (errors.length > 0) {
    lines.push("Fix these schema validation errors:");
    errors.forEach((err, idx) => {
      lines.push(`${idx + 1}. Path ${err.instanceLocation}: ${err.error}`);
    });
  }
  return lines.join("\n");
}

