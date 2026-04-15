/**
 * Geometry and viewport math helpers for the canvas engine.
 *
 * All coordinate math is centralised here so canvas components stay
 * declarative and don't embed raw arithmetic.
 */

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface BoundingBox extends Point, Size {}

/** Clamp a value between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Clamp zoom scale to reasonable bounds (10% – 500%). */
export const MIN_SCALE = 0.1;
export const MAX_SCALE = 5;

export function clampScale(scale: number): number {
  return clamp(scale, MIN_SCALE, MAX_SCALE);
}

/**
 * Convert a pointer position from screen-space to canvas-space,
 * accounting for the current stage position and scale.
 */
export function screenToCanvas(
  screenPos: Point,
  stagePos: Point,
  scale: number,
): Point {
  return {
    x: (screenPos.x - stagePos.x) / scale,
    y: (screenPos.y - stagePos.y) / scale,
  };
}

/**
 * Compute the triangle vertices for a RegularPolygon stand-in.
 * Konva's RegularPolygon uses radius, so we derive it from width/height.
 */
export function triangleRadius(width: number, height: number): number {
  return Math.max(width, height) / 2;
}
