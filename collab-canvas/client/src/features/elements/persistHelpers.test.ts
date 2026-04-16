import { describe, it, expect } from "vitest";
import { idsRemovedFromCanvas } from "./persistHelpers.ts";

describe("idsRemovedFromCanvas", () => {
  it("returns ids persisted on the server that are no longer in the canvas map", () => {
    const persisted = new Set<string>(["a", "b", "c"]);
    const current = new Set<string>(["b"]);
    expect(idsRemovedFromCanvas(persisted, current)).toEqual(["a", "c"]);
  });

  it("returns empty when nothing was removed", () => {
    const persisted = new Set<string>(["x"]);
    const current = new Set<string>(["x", "y"]);
    expect(idsRemovedFromCanvas(persisted, current)).toEqual([]);
  });

  it("returns empty when persisted is empty", () => {
    expect(idsRemovedFromCanvas(new Set(), new Set(["n"]))).toEqual([]);
  });
});
