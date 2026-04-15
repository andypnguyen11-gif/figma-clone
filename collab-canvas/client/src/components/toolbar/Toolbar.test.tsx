import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { Toolbar } from "./Toolbar.tsx";
import { useCanvasStore } from "../../features/canvas/canvasStore.ts";
import { useElementStore } from "../../features/elements/elementStore.ts";

describe("Toolbar", () => {
  beforeEach(() => {
    useCanvasStore.setState({ selectedTool: "select" });
    useElementStore.setState({ elements: new Map(), selectedElementId: null });
  });

  it("renders tool buttons for all shape types", () => {
    render(<Toolbar />);
    expect(screen.getByRole("button", { name: /select/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /rectangle/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /circle/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /line/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /triangle/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /text/i })).toBeDefined();
  });

  it("highlights the currently selected tool", () => {
    useCanvasStore.setState({ selectedTool: "rectangle" });
    render(<Toolbar />);
    const btn = screen.getByRole("button", { name: /rectangle/i });
    expect(btn.getAttribute("aria-pressed")).toBe("true");
  });

  it("does not highlight unselected tools", () => {
    useCanvasStore.setState({ selectedTool: "select" });
    render(<Toolbar />);
    const btn = screen.getByRole("button", { name: /rectangle/i });
    expect(btn.getAttribute("aria-pressed")).toBe("false");
  });

  it("changes the selected tool on click", () => {
    render(<Toolbar />);
    fireEvent.click(screen.getByRole("button", { name: /circle/i }));
    expect(useCanvasStore.getState().selectedTool).toBe("circle");
  });

  it("deselects the current element when switching tools", () => {
    useElementStore.setState({ selectedElementId: "e1", elements: new Map() });
    render(<Toolbar />);
    fireEvent.click(screen.getByRole("button", { name: /rectangle/i }));
    expect(useElementStore.getState().selectedElementId).toBeNull();
  });

  it("keeps the same tool selected when clicking it again", () => {
    useCanvasStore.setState({ selectedTool: "line" });
    render(<Toolbar />);
    fireEvent.click(screen.getByRole("button", { name: /line/i }));
    expect(useCanvasStore.getState().selectedTool).toBe("line");
  });
});
