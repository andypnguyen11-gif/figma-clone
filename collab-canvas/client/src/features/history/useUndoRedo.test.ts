import { describe, it, expect, beforeEach } from "vitest";
import { useHistoryStore } from "./historyStore.ts";
import { useElementStore } from "../elements/elementStore.ts";
import { pushSnapshot, performUndo, performRedo, deleteSelectedElement } from "./useUndoRedo.ts";
import type { CanvasElement } from "../../types/element.ts";

const makeElement = (overrides: Partial<CanvasElement> = {}): CanvasElement => ({
  id: "e1",
  canvasId: "c1",
  elementType: "rectangle",
  x: 0,
  y: 0,
  width: 100,
  height: 50,
  fill: "#FFFFFF",
  stroke: "#000000",
  strokeWidth: 1,
  opacity: 1,
  rotation: 0,
  zIndex: 0,
  textContent: null,
  fontSize: null,
  textColor: null,
  createdAt: "",
  updatedAt: "",
  ...overrides,
});

function resetStores(): void {
  useElementStore.setState({
    elements: new Map(),
    selectedElementId: null,
    editingTextElementId: null,
  });
  useHistoryStore.setState({ undoStack: [], redoStack: [] });
}

describe("useUndoRedo", () => {
  beforeEach(resetStores);

  // --- pushSnapshot ---

  describe("pushSnapshot", () => {
    it("captures current elements onto the undo stack", () => {
      useElementStore.getState().addElement(makeElement({ id: "e1" }));
      pushSnapshot();
      expect(useHistoryStore.getState().undoStack).toHaveLength(1);
      expect(useHistoryStore.getState().undoStack[0]![0]!.id).toBe("e1");
    });

    it("clears the redo stack", () => {
      useElementStore.getState().addElement(makeElement({ id: "e1" }));
      pushSnapshot();
      useElementStore.getState().addElement(makeElement({ id: "e2" }));
      performUndo();
      expect(useHistoryStore.getState().redoStack).toHaveLength(1);

      pushSnapshot();
      expect(useHistoryStore.getState().redoStack).toHaveLength(0);
    });
  });

  // --- undo ---

  describe("performUndo", () => {
    it("restores the previous element state", () => {
      useElementStore.getState().addElement(makeElement({ id: "e1" }));
      pushSnapshot();
      useElementStore.getState().addElement(makeElement({ id: "e2" }));

      performUndo();

      const ids = useElementStore.getState().getAllElements().map((e) => e.id);
      expect(ids).toEqual(["e1"]);
    });

    it("pushes the current state onto the redo stack", () => {
      pushSnapshot();
      useElementStore.getState().addElement(makeElement({ id: "e1" }));

      performUndo();

      expect(useHistoryStore.getState().redoStack).toHaveLength(1);
      expect(useHistoryStore.getState().redoStack[0]![0]!.id).toBe("e1");
    });

    it("does nothing when undo stack is empty", () => {
      useElementStore.getState().addElement(makeElement({ id: "e1" }));
      performUndo();
      expect(useElementStore.getState().getAllElements()).toHaveLength(1);
    });

    it("clears selection after undo", () => {
      useElementStore.getState().addElement(makeElement({ id: "e1" }));
      useElementStore.getState().setSelectedElementId("e1");
      pushSnapshot();
      useElementStore.getState().removeElement("e1");

      performUndo();
      expect(useElementStore.getState().selectedElementId).toBeNull();
    });
  });

  // --- redo ---

  describe("performRedo", () => {
    it("reapplies the undone state", () => {
      pushSnapshot();
      useElementStore.getState().addElement(makeElement({ id: "e1" }));

      performUndo();
      expect(useElementStore.getState().getAllElements()).toHaveLength(0);

      performRedo();
      const ids = useElementStore.getState().getAllElements().map((e) => e.id);
      expect(ids).toEqual(["e1"]);
    });

    it("pushes the current state back onto the undo stack", () => {
      pushSnapshot();
      useElementStore.getState().addElement(makeElement({ id: "e1" }));

      performUndo();
      performRedo();

      expect(useHistoryStore.getState().undoStack).toHaveLength(1);
    });

    it("does nothing when redo stack is empty", () => {
      useElementStore.getState().addElement(makeElement({ id: "e1" }));
      performRedo();
      expect(useElementStore.getState().getAllElements()).toHaveLength(1);
    });

    it("clears selection after redo", () => {
      useElementStore.getState().addElement(makeElement({ id: "e1" }));
      useElementStore.getState().setSelectedElementId("e1");
      pushSnapshot();
      useElementStore.getState().removeElement("e1");

      performUndo();
      performRedo();
      expect(useElementStore.getState().selectedElementId).toBeNull();
    });
  });

  // --- multi-step undo/redo ---

  describe("multi-step undo/redo", () => {
    it("supports multiple sequential undos", () => {
      pushSnapshot();
      useElementStore.getState().addElement(makeElement({ id: "e1" }));

      pushSnapshot();
      useElementStore.getState().addElement(makeElement({ id: "e2" }));

      performUndo();
      expect(useElementStore.getState().getAllElements().map((e) => e.id)).toEqual(["e1"]);

      performUndo();
      expect(useElementStore.getState().getAllElements()).toHaveLength(0);
    });

    it("supports undo then redo then undo", () => {
      pushSnapshot();
      useElementStore.getState().addElement(makeElement({ id: "e1" }));

      performUndo();
      expect(useElementStore.getState().getAllElements()).toHaveLength(0);

      performRedo();
      expect(useElementStore.getState().getAllElements()).toHaveLength(1);

      performUndo();
      expect(useElementStore.getState().getAllElements()).toHaveLength(0);
    });
  });

  // --- deleteSelectedElement ---

  describe("deleteSelectedElement", () => {
    it("removes the selected element", () => {
      useElementStore.getState().addElement(makeElement({ id: "e1" }));
      useElementStore.getState().setSelectedElementId("e1");

      deleteSelectedElement();

      expect(useElementStore.getState().getElement("e1")).toBeUndefined();
    });

    it("clears the selection", () => {
      useElementStore.getState().addElement(makeElement({ id: "e1" }));
      useElementStore.getState().setSelectedElementId("e1");

      deleteSelectedElement();

      expect(useElementStore.getState().selectedElementId).toBeNull();
    });

    it("pushes a snapshot before deletion (undoable)", () => {
      useElementStore.getState().addElement(makeElement({ id: "e1" }));
      useElementStore.getState().setSelectedElementId("e1");

      deleteSelectedElement();
      performUndo();

      expect(useElementStore.getState().getElement("e1")).toBeDefined();
    });

    it("does nothing when no element is selected", () => {
      useElementStore.getState().addElement(makeElement({ id: "e1" }));
      deleteSelectedElement();
      expect(useElementStore.getState().getAllElements()).toHaveLength(1);
    });
  });
});
