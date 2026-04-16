/**
 * Tests for share invite input parsing (token vs full URL paste).
 */
import { describe, it, expect } from "vitest";
import { parseShareTokenFromInput } from "./shareToken.ts";

describe("parseShareTokenFromInput", () => {
  it("returns trimmed raw token when no URL pattern", () => {
    const hex = "a1b2c3d4e5f6789012345678abcdef01";
    expect(parseShareTokenFromInput(`  ${hex}  `)).toBe(hex);
  });

  it("extracts token from invite URL path .../join/<token>", () => {
    expect(
      parseShareTokenFromInput(
        "http://localhost:8000/canvas/join/a1b2c3d4e5f6789012345678abcdef01",
      ),
    ).toBe("a1b2c3d4e5f6789012345678abcdef01");
  });

  it("stops token at query or hash", () => {
    expect(
      parseShareTokenFromInput(
        "https://app.example.com/api/canvas/join/abc123?x=1#frag",
      ),
    ).toBe("abc123");
  });

  it("decodes percent-encoded token segment", () => {
    expect(parseShareTokenFromInput("/join/hello%20world")).toBe("hello world");
  });
});
