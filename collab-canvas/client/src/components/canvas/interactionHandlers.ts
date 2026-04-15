/**
 * Interaction handlers — pure functions for creating canvas elements.
 *
 * These are called by CanvasViewport during click/drag workflows.
 * They produce CanvasElement objects without side effects, keeping
 * the store mutation in the component layer.
 */
import type { CanvasElement, ElementType } from "../../types/element.ts";
import type { Point } from "../../utils/geometry.ts";

/** Minimum dimension for newly created shapes (prevents invisible shapes). */
export const MIN_ELEMENT_SIZE = 10;

/** Default size when a shape is created by a single click (no drag). */
const DEFAULT_SIZE: Record<ElementType, { width: number; height: number }> = {
  rectangle: { width: 150, height: 100 },
  circle: { width: 100, height: 100 },
  line: { width: 150, height: 0 },
  triangle: { width: 120, height: 120 },
  text: { width: 200, height: 30 },
};

const DEFAULT_FILL: Record<ElementType, string> = {
  rectangle: "#3B82F6",
  circle: "#EF4444",
  line: "transparent",
  triangle: "#10B981",
  text: "transparent",
};

const DEFAULT_STROKE: Record<ElementType, string> = {
  rectangle: "#1E40AF",
  circle: "#991B1B",
  line: "#FFFFFF",
  triangle: "#065F46",
  text: "transparent",
};

let zIndexCounter = 100;

/**
 * Create a new element from a single click (default dimensions).
 * Used when the user clicks without dragging.
 */
export function createShapeElement(
  elementType: ElementType,
  position: Point,
  canvasId: string,
): CanvasElement {
  const size = DEFAULT_SIZE[elementType];
  const isText = elementType === "text";

  return {
    id: crypto.randomUUID(),
    canvasId,
    elementType,
    x: position.x,
    y: position.y,
    width: size.width,
    height: size.height,
    fill: DEFAULT_FILL[elementType],
    stroke: DEFAULT_STROKE[elementType],
    strokeWidth: elementType === "line" ? 2 : 1,
    opacity: 1,
    rotation: 0,
    zIndex: zIndexCounter++,
    textContent: isText ? "" : null,
    fontSize: isText ? 16 : null,
    textColor: isText ? "#FFFFFF" : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Create a new element from a click-drag gesture.
 * Normalises the bounding box so negative-direction drags work correctly.
 */
export function createShapeFromDrag(
  elementType: ElementType,
  start: Point,
  end: Point,
  canvasId: string,
): CanvasElement {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const rawW = Math.abs(end.x - start.x);
  const rawH = Math.abs(end.y - start.y);
  const width = Math.max(rawW, MIN_ELEMENT_SIZE);
  const height = Math.max(rawH, MIN_ELEMENT_SIZE);
  const isText = elementType === "text";

  return {
    id: crypto.randomUUID(),
    canvasId,
    elementType,
    x,
    y,
    width,
    height,
    fill: DEFAULT_FILL[elementType],
    stroke: DEFAULT_STROKE[elementType],
    strokeWidth: elementType === "line" ? 2 : 1,
    opacity: 1,
    rotation: 0,
    zIndex: zIndexCounter++,
    textContent: isText ? "" : null,
    fontSize: isText ? 16 : null,
    textColor: isText ? "#FFFFFF" : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
