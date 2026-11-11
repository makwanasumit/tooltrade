import { describe, it, expect } from "vitest";
import { findJsonErrorOffset, parseAndFormatJson } from "@/features/json-tools/jsonFormatEngine";

describe("JSON error location", () => {
  it("returns null for valid JSON", () => {
    expect(findJsonErrorOffset('{"a": [1, 2.5e3, true, null, "x\\n"], "b": {}}')).toBeNull();
    expect(findJsonErrorOffset("  [ ]  ")).toBeNull();
  });

  it("points at the first offending character", () => {
    const text = '{"a": 1,\n"b": ,\n"c": 3}';
    expect(findJsonErrorOffset(text)).toBe(text.indexOf(",\n\"c\"")); // the stray comma on line 2
    expect(findJsonErrorOffset('{"a": 1,}')).toBe(8); // trailing comma
    expect(findJsonErrorOffset("{'a': 1}")).toBe(1); // single quotes
    expect(findJsonErrorOffset('{"a": 1')).toBe(7); // unexpected end
  });

  it("reports line and column for invalid input", () => {
    const res = parseAndFormatJson('{"a": 1,\n"b": ,\n"c": 3}');
    expect(res.valid).toBe(false);
    expect(res.error?.line).toBe(2);
    expect(res.error?.column).toBe(6);
  });
});
