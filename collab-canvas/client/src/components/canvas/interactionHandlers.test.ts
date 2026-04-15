import { describe, it, expect } from "vitest";
import {
  createShapeElement,
  createShapeFromDrag,
  MIN_ELEMENT_SIZE,
} from "./interactionHandlers.ts";

describe("interactionHandlers", () => {
  describe("createShapeElement (single-click creation)", () => {
    it("creates a rectangle at the given position with default size", () => {
      const el = createShapeElement("rectangle", { x: 100, y: 200 }, "c1");
      expect(el.elementType).toBe("rectangle");
      expect(el.x).toBe(100);
      expect(el.y).toBe(200);
      expect(el.width).toBeGreaterThan(0);
      expect(el.height).toBeGreaterThan(0);
      expect(el.canvasId).toBe("c1");
      expect(el.id).toBeTruthy();
    });

    it("creates a circle with equal width and height", () => {
      const el = createShapeElement("circle", { x: 50, y: 50 }, "c1");
      expect(el.elementType).toBe("circle");
      expect(el.width).toBe(el.height);
    });

    it("creates a text element with empty content and default font size", () => {
      const el = createShapeElement("text", { x: 50, y: 50 }, "c1");
      expect(el.elementType).toBe("text");
      expect(el.textContent).toBe("");
      expect(el.fontSize).toBe(16);
      expect(el.textColor).toBe("#FFFFFF");
    });

    it("creates a line element", () => {
      const el = createShapeElement("line", { x: 10, y: 20 }, "c1");
      expect(el.elementType).toBe("line");
    });

    it("creates a triangle element", () => {
      const el = createShapeElement("triangle", { x: 10, y: 20 }, "c1");
      expect(el.elementType).toBe("triangle");
    });

    it("assigns incrementing zIndex values", () => {
      const a = createShapeElement("rectangle", { x: 0, y: 0 }, "c1");
      const b = createShapeElement("rectangle", { x: 0, y: 0 }, "c1");
      expect(b.zIndex).toBeGreaterThan(a.zIndex);
    });

    it("generates unique IDs for each element", () => {
      const ids = new Set<string>();
      for (let i = 0; i < 20; i++) {
        ids.add(createShapeElement("rectangle", { x: 0, y: 0 }, "c1").id);
      }
      expect(ids.size).toBe(20);
    });
  });

  describe("createShapeFromDrag (click-drag creation)", () => {
    it("computes width and height from start and end positions", () => {
      const el = createShapeFromDrag(
        "rectangle",
        { x: 10, y: 20 },
        { x: 210, y: 120 },
        "c1",
      );
      expect(el.x).toBe(10);
      expect(el.y).toBe(20);
      expect(el.width).toBe(200);
      expect(el.height).toBe(100);
    });

    it("normalises negative drag direction (bottom-right to top-left)", () => {
      const el = createShapeFromDrag(
        "rectangle",
        { x: 200, y: 200 },
        { x: 100, y: 100 },
        "c1",
      );
      expect(el.x).toBe(100);
      expect(el.y).toBe(100);
      expect(el.width).toBe(100);
      expect(el.height).toBe(100);
    });

    it("enforces a minimum size for very small drags", () => {
      const el = createShapeFromDrag(
        "circle",
        { x: 100, y: 100 },
        { x: 101, y: 101 },
        "c1",
      );
      expect(el.width).toBeGreaterThanOrEqual(MIN_ELEMENT_SIZE);
      expect(el.height).toBeGreaterThanOrEqual(MIN_ELEMENT_SIZE);
    });

    it("creates correct element type", () => {
      const el = createShapeFromDrag(
        "triangle",
        { x: 0, y: 0 },
        { x: 80, y: 80 },
        "c1",
      );
      expect(el.elementType).toBe("triangle");
    });
  });
});
