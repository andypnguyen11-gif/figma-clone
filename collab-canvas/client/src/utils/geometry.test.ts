import { describe, it, expect } from "vitest";
import {
  clamp,
  clampScale,
  screenToCanvas,
  triangleRadius,
  MIN_SCALE,
  MAX_SCALE,
} from "./geometry.ts";

describe("geometry helpers", () => {
  it("clamps value within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("clamps scale to min/max bounds", () => {
    expect(clampScale(0.01)).toBe(MIN_SCALE);
    expect(clampScale(100)).toBe(MAX_SCALE);
    expect(clampScale(1)).toBe(1);
  });

  it("converts screen coords to canvas coords", () => {
    const result = screenToCanvas(
      { x: 300, y: 200 },
      { x: 100, y: 50 },
      2,
    );
    expect(result.x).toBe(100);
    expect(result.y).toBe(75);
  });

  it("computes triangle radius from width/height", () => {
    expect(triangleRadius(100, 80)).toBe(50);
    expect(triangleRadius(60, 120)).toBe(60);
  });
});
