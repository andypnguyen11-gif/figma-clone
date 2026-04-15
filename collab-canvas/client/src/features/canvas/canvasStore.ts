/**
 * Canvas store — holds current canvas metadata and the active tool.
 *
 * selectedTool drives which shape (or select mode) is created on
 * canvas click/drag. The canvas metadata is set when loading or
 * joining a canvas via the API.
 */
import { create } from "zustand";
import type { Canvas, ToolType } from "../../types/canvas.ts";

interface CanvasState {
  canvas: Canvas | null;
  selectedTool: ToolType;

  setCanvas: (canvas: Canvas) => void;
  clearCanvas: () => void;
  setSelectedTool: (tool: ToolType) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  canvas: null,
  selectedTool: "select",

  setCanvas: (canvas) => set({ canvas }),
  clearCanvas: () => set({ canvas: null }),
  setSelectedTool: (tool) => set({ selectedTool: tool }),
}));
