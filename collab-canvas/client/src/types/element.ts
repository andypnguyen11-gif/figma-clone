/**
 * Element types and interfaces matching the backend Element model.
 * Used across stores, components, and API services.
 */

export type ElementType = "rectangle" | "circle" | "line" | "triangle" | "text";

export interface CanvasElement {
  id: string;
  canvasId: string;
  elementType: ElementType;

  x: number;
  y: number;
  width: number;
  height: number;

  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  rotation: number;
  zIndex: number;

  textContent: string | null;
  fontSize: number | null;
  textColor: string | null;

  createdAt: string;
  updatedAt: string;
}

/** Fields allowed when creating a new element. */
export interface ElementCreatePayload {
  elementType: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  rotation?: number;
  zIndex?: number;
  textContent?: string;
  fontSize?: number;
  textColor?: string;
}

/** Fields allowed when updating an existing element (all optional). */
export type ElementUpdatePayload = Partial<
  Omit<CanvasElement, "id" | "canvasId" | "elementType" | "createdAt" | "updatedAt">
>;
