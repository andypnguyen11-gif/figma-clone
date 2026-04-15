import { describe, it, expect, beforeEach } from "vitest";
import { useCanvasStore } from "./canvasStore.ts";
import type { Canvas } from "../../types/canvas.ts";

const mockCanvas: Canvas = {
  id: "c1",
  title: "Test Canvas",
  ownerId: "u1",
  shareToken: "abc123",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("canvasStore", () => {
  beforeEach(() => {
    useCanvasStore.setState({ canvas: null, selectedTool: "select" });
  });

  it("starts with no canvas and select tool", () => {
    const state = useCanvasStore.getState();
    expect(state.canvas).toBeNull();
    expect(state.selectedTool).toBe("select");
  });

  it("sets canvas metadata", () => {
    useCanvasStore.getState().setCanvas(mockCanvas);
    expect(useCanvasStore.getState().canvas).toEqual(mockCanvas);
  });

  it("clears canvas", () => {
    useCanvasStore.getState().setCanvas(mockCanvas);
    useCanvasStore.getState().clearCanvas();
    expect(useCanvasStore.getState().canvas).toBeNull();
  });

  it("changes selected tool", () => {
    useCanvasStore.getState().setSelectedTool("rectangle");
    expect(useCanvasStore.getState().selectedTool).toBe("rectangle");
  });
});
