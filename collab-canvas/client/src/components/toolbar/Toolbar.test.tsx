import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { Toolbar } from "./Toolbar.tsx";
import { useCanvasStore } from "../../features/canvas/canvasStore.ts";
import { useElementStore } from "../../features/elements/elementStore.ts";
import { useHistoryStore } from "../../features/history/historyStore.ts";
import type { CanvasElement } from "../../types/element.ts";

const makeElement = (overrides: Partial<CanvasElement> = {}): CanvasElement => ({
  id: "e1",
  canvasId: "c1",
  elementType: "rectangle",
  x: 0, y: 0, width: 100, height: 50,
  fill: "#FFF", stroke: "#000", strokeWidth: 1,
  opacity: 1, rotation: 0, zIndex: 0,
  textContent: null, fontSize: null, textColor: null,
  createdAt: "", updatedAt: "",
  ...overrides,
});

describe("Toolbar", () => {
  beforeEach(() => {
    useCanvasStore.setState({ selectedTool: "select" });
    useElementStore.setState({ elements: new Map(), selectedElementId: null });
    useHistoryStore.setState({ undoStack: [], redoStack: [] });
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

  // --- Action buttons (PR-10) ---

  it("renders delete, undo, and redo action buttons", () => {
    render(<Toolbar />);
    expect(screen.getByRole("button", { name: /delete/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /undo/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /redo/i })).toBeDefined();
  });

  it("deletes the selected element when delete button is clicked", () => {
    const el = makeElement({ id: "e1" });
    const elements = new Map<string, CanvasElement>();
    elements.set(el.id, el);
    useElementStore.setState({ elements, selectedElementId: "e1" });

    render(<Toolbar />);
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));

    expect(useElementStore.getState().getElement("e1")).toBeUndefined();
    expect(useElementStore.getState().selectedElementId).toBeNull();
  });

  it("disables delete button when nothing is selected", () => {
    render(<Toolbar />);
    const btn = screen.getByRole("button", { name: /delete/i });
    expect(btn).toBeDisabled();
  });

  it("undo button restores previous state", () => {
    const el = makeElement({ id: "e1" });
    const elements = new Map<string, CanvasElement>();
    elements.set(el.id, el);
    useElementStore.setState({ elements, selectedElementId: "e1" });

    useHistoryStore.getState().pushUndo([]);

    render(<Toolbar />);
    fireEvent.click(screen.getByRole("button", { name: /undo/i }));

    expect(useElementStore.getState().getAllElements()).toHaveLength(0);
  });

  it("disables undo button when undo stack is empty", () => {
    render(<Toolbar />);
    const btn = screen.getByRole("button", { name: /undo/i });
    expect(btn).toBeDisabled();
  });

  it("disables redo button when redo stack is empty", () => {
    render(<Toolbar />);
    const btn = screen.getByRole("button", { name: /redo/i });
    expect(btn).toBeDisabled();
  });
});
