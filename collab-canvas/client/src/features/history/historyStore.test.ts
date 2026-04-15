import { describe, it, expect, beforeEach } from "vitest";
import { useHistoryStore } from "./historyStore.ts";
import type { CanvasElement } from "../../types/element.ts";

const snapshot = (id: string): CanvasElement[] => [
  {
    id,
    canvasId: "c1",
    elementType: "rectangle",
    x: 0, y: 0, width: 50, height: 50,
    fill: "#FFF", stroke: "#000", strokeWidth: 1,
    opacity: 1, rotation: 0, zIndex: 0,
    textContent: null, fontSize: null, textColor: null,
    createdAt: "", updatedAt: "",
  },
];

describe("historyStore", () => {
  beforeEach(() => {
    useHistoryStore.setState({ undoStack: [], redoStack: [] });
  });

  it("starts with empty stacks", () => {
    const state = useHistoryStore.getState();
    expect(state.undoStack).toHaveLength(0);
    expect(state.redoStack).toHaveLength(0);
  });

  it("pushes to undo stack", () => {
    useHistoryStore.getState().pushUndo(snapshot("s1"));
    expect(useHistoryStore.getState().undoStack).toHaveLength(1);
  });

  it("clears redo stack on new push", () => {
    useHistoryStore.getState().pushUndo(snapshot("s1"));
    useHistoryStore.getState().undo();
    expect(useHistoryStore.getState().redoStack).toHaveLength(1);

    useHistoryStore.getState().pushUndo(snapshot("s2"));
    expect(useHistoryStore.getState().redoStack).toHaveLength(0);
  });

  it("undo returns the last snapshot and moves it to redo", () => {
    useHistoryStore.getState().pushUndo(snapshot("s1"));
    useHistoryStore.getState().pushUndo(snapshot("s2"));

    const result = useHistoryStore.getState().undo();
    expect(result?.[0]?.id).toBe("s2");
    expect(useHistoryStore.getState().undoStack).toHaveLength(1);
    expect(useHistoryStore.getState().redoStack).toHaveLength(1);
  });

  it("redo returns the last undone snapshot", () => {
    useHistoryStore.getState().pushUndo(snapshot("s1"));
    useHistoryStore.getState().undo();

    const result = useHistoryStore.getState().redo();
    expect(result?.[0]?.id).toBe("s1");
    expect(useHistoryStore.getState().undoStack).toHaveLength(1);
    expect(useHistoryStore.getState().redoStack).toHaveLength(0);
  });

  it("undo returns null when stack is empty", () => {
    expect(useHistoryStore.getState().undo()).toBeNull();
  });

  it("redo returns null when stack is empty", () => {
    expect(useHistoryStore.getState().redo()).toBeNull();
  });

  it("caps undo stack at 50 entries", () => {
    for (let i = 0; i < 60; i++) {
      useHistoryStore.getState().pushUndo(snapshot(`s${i}`));
    }
    expect(useHistoryStore.getState().undoStack).toHaveLength(50);
  });

  it("clears all history", () => {
    useHistoryStore.getState().pushUndo(snapshot("s1"));
    useHistoryStore.getState().clearHistory();
    const state = useHistoryStore.getState();
    expect(state.undoStack).toHaveLength(0);
    expect(state.redoStack).toHaveLength(0);
  });
});
