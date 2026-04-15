/**
 * Canvas types matching the backend Canvas model.
 */

export interface Canvas {
  id: string;
  title: string;
  ownerId: string;
  shareToken: string;
  createdAt: string;
  updatedAt: string;
}

export type ToolType =
  | "select"
  | "rectangle"
  | "circle"
  | "line"
  | "triangle"
  | "text";
