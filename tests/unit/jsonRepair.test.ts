import { describe, it, expect } from "vitest";
import { repairLlmJson } from "@/features/ai-prep/json-repair/jsonRepairEngine";
import {
  buildFixPrompt,
  validateAgainstJsonSchema,
} from "@/features/ai-prep/json-repair/schemaValidator";

const MALFORMED_CASES = [
  '```json\n{"a": 1}\n```',
  'Here is the output:\n{"a": 1, "b": 2}\nHope this helps!',
  '{a: 1, b: "two"}',
  "{'a': 'hello', 'b': 'world'}",
  '{"a": True, "b": False, "c": None}',
  '{"arr": [1, 2, 3,], "obj": {"k": "v",},}',
  '{\n// comment\n"x": 10,\n/* multi\nline */\n"y": 20\n}',
  '{"msg": "line 1\nline 2"}',
  '{"ok": undefined, "bad": NaN}',
  '{"items": [{"name": "a"}, {"name": "b"',
  '{"open": "truncated string',
  "['x', 'y', 'z',]",
];

describe("LLM JSON repair & schema validator", () => {
  it("repairs common malformed LLM patterns deterministically and idempotently", () => {
    for (const raw of MALFORMED_CASES) {
      const first = repairLlmJson(raw);
      expect(first.parsesCleanly).toBe(true);
      expect(() => JSON.parse(first.repairedText)).not.toThrow();

      // Idempotency check
      const second = repairLlmJson(first.repairedText);
      expect(second.status).toBe("unchanged");
      expect(second.repairedText).toBe(first.repairedText);
    }
  });

  it("flags truncation explicitly without inventing missing required fields", () => {
    const res = repairLlmJson('{"id": 1, "items": [{"name": "alpha"');
    expect(res.truncatedDetected).toBe(true);
    expect(res.parsesCleanly).toBe(true);
    const parsed = JSON.parse(res.repairedText) as Record<string, unknown>;
    expect(parsed.email).toBeUndefined();
  });

  it("supports undoing a specific rule", () => {
    const res = repairLlmJson('{"a": 1,}', new Set(["remove_trailing_commas"]));
    expect(res.parsesCleanly).toBe(false);
  });

  it("validates draft 2020-12 schema and builds fix prompt without fabricating data", () => {
    const schema = JSON.stringify({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      required: ["id", "email"],
      properties: {
        id: { type: "integer" },
        email: { type: "string" },
      },
      customUnknownKeyword: true,
    });
    const check = validateAgainstJsonSchema({ id: "wrong" }, schema);
    expect(check.valid).toBe(false);
    expect(check.unsupportedKeywords).toContain("customUnknownKeyword");
    expect(check.errors.length).toBeGreaterThan(0);

    const prompt = buildFixPrompt(check.errors, true);
    expect(prompt).toContain("truncated");
    expect(prompt).toContain("schema validation errors");
  });
});

