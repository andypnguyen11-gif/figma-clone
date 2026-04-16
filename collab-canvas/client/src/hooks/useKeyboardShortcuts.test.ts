/**
 * Tests for useKeyboardShortcuts — global keyboard shortcut handler.
 *
 * Verifies that all documented shortcuts dispatch the correct actions:
 * tool switches (V/R/C/L/T), delete, undo (Ctrl+Z), and redo (Ctrl+Shift+Z).
 * Also ensures shortcuts are suppressed when focus is inside an input,
 * textarea, or contenteditable element.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import { useCanvasStore } from "../features/canvas/canvasStore";
import { useElementStore } from "../features/elements/elementStore";
import { useHistoryStore } from "../features/history/historyStore";

function fireKey(
  key: string,
  opts: Partial<KeyboardEventInit> = {},
  target?: HTMLElement,
): void {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...opts,
  });
  if (target) {
    Object.defineProperty(event, "target", { value: target });
  }
  window.dispatchEvent(event);
}

function seedElement(id = "el-1"): void {
  useElementStore.getState().addElement({
    id,
    canvasId: "c1",
    elementType: "rectangle",
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    fill: "#000",
    stroke: "#000",
    strokeWidth: 1,
    opacity: 1,
    rotation: 0,
    zIndex: 0,
    textContent: null,
    fontSize: null,
    textColor: null,
    createdAt: "",
    updatedAt: "",
  });
}

describe("useKeyboardShortcuts", () => {
  let cleanup: ReturnType<typeof renderHook>["unmount"];

  beforeEach(() => {
    useCanvasStore.setState({ selectedTool: "select" });
    useElementStore.setState({ elements: new Map(), selectedElementId: null });
    useHistoryStore.setState({ undoStack: [], redoStack: [] });

    const result = renderHook(() => useKeyboardShortcuts());
    cleanup = result.unmount;
  });

  afterEach(() => {
    cleanup();
  });

  // --- Tool switching shortcuts ---

  it("switches to select tool on V key", () => {
    useCanvasStore.setState({ selectedTool: "rectangle" });
    fireKey("v");
    expect(useCanvasStore.getState().selectedTool).toBe("select");
  });

  it("switches to rectangle tool on R key", () => {
    fireKey("r");
    expect(useCanvasStore.getState().selectedTool).toBe("rectangle");
  });

  it("switches to circle tool on C key", () => {
    fireKey("c");
    expect(useCanvasStore.getState().selectedTool).toBe("circle");
  });

  it("switches to line tool on L key", () => {
    fireKey("l");
    expect(useCanvasStore.getState().selectedTool).toBe("line");
  });

  it("switches to text tool on T key", () => {
    fireKey("t");
    expect(useCanvasStore.getState().selectedTool).toBe("text");
  });

  it("clears element selection when switching tools", () => {
    seedElement("el-1");
    useElementStore.getState().setSelectedElementId("el-1");

    fireKey("r");
    expect(useElementStore.getState().selectedElementId).toBeNull();
  });

  // --- Delete shortcut ---

  it("deletes selected element on Delete key", () => {
    seedElement("el-1");
    useElementStore.getState().setSelectedElementId("el-1");

    fireKey("Delete");
    expect(useElementStore.getState().getElement("el-1")).toBeUndefined();
    expect(useElementStore.getState().selectedElementId).toBeNull();
  });

  it("deletes selected element on Backspace key", () => {
    seedElement("el-1");
    useElementStore.getState().setSelectedElementId("el-1");

    fireKey("Backspace");
    expect(useElementStore.getState().getElement("el-1")).toBeUndefined();
  });

  it("does nothing on Delete when nothing is selected", () => {
    seedElement("el-1");
    fireKey("Delete");
    expect(useElementStore.getState().getElement("el-1")).toBeDefined();
  });

  // --- Undo / Redo shortcuts ---

  it("performs undo on Ctrl+Z", () => {
    seedElement("el-1");
    useHistoryStore.getState().pushUndo(
      useElementStore.getState().getAllElements(),
    );
    useElementStore.getState().removeElement("el-1");

    fireKey("z", { ctrlKey: true });
    expect(useElementStore.getState().getElement("el-1")).toBeDefined();
  });

  it("performs undo on Cmd+Z (macOS)", () => {
    seedElement("el-1");
    useHistoryStore.getState().pushUndo(
      useElementStore.getState().getAllElements(),
    );
    useElementStore.getState().removeElement("el-1");

    fireKey("z", { metaKey: true });
    expect(useElementStore.getState().getElement("el-1")).toBeDefined();
  });

  it("performs redo on Ctrl+Shift+Z", () => {
    seedElement("el-1");
    useHistoryStore.getState().pushUndo(
      useElementStore.getState().getAllElements(),
    );
    useElementStore.getState().removeElement("el-1");

    fireKey("z", { ctrlKey: true });
    expect(useElementStore.getState().getElement("el-1")).toBeDefined();

    fireKey("z", { ctrlKey: true, shiftKey: true });
    expect(useElementStore.getState().getElement("el-1")).toBeUndefined();
  });

  it("performs redo on Cmd+Shift+Z (macOS)", () => {
    seedElement("el-1");
    useHistoryStore.getState().pushUndo(
      useElementStore.getState().getAllElements(),
    );
    useElementStore.getState().removeElement("el-1");

    fireKey("z", { metaKey: true });
    fireKey("z", { metaKey: true, shiftKey: true });
    expect(useElementStore.getState().getElement("el-1")).toBeUndefined();
  });

  // --- Input suppression ---

  it("ignores shortcuts when an input is focused", () => {
    const input = document.createElement("input");
    fireKey("r", {}, input);
    expect(useCanvasStore.getState().selectedTool).toBe("select");
  });

  it("ignores shortcuts when a textarea is focused", () => {
    const textarea = document.createElement("textarea");
    fireKey("r", {}, textarea);
    expect(useCanvasStore.getState().selectedTool).toBe("select");
  });

  it("ignores shortcuts when a contenteditable element is focused", () => {
    const div = document.createElement("div");
    div.setAttribute("contenteditable", "true");
    fireKey("r", {}, div);
    expect(useCanvasStore.getState().selectedTool).toBe("select");
  });

  // --- Tool shortcuts should not fire with modifier keys ---

  it("does not switch tool when Ctrl is held with a tool key", () => {
    fireKey("r", { ctrlKey: true });
    expect(useCanvasStore.getState().selectedTool).toBe("select");
  });

  it("does not switch tool when Meta is held with a tool key", () => {
    fireKey("r", { metaKey: true });
    expect(useCanvasStore.getState().selectedTool).toBe("select");
  });
});
