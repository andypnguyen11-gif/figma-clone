/**
 * History store — undo/redo stack for canvas element state.
 *
 * Stores snapshots of the full element map. Each mutation (create,
 * move, resize, delete, property change) should push the pre-mutation
 * state onto the undo stack. Redo is cleared on any new mutation
 * (standard undo/redo semantics).
 *
 * Stack depth is capped at 50 to bound memory usage.
 */
import { create } from "zustand";
import type { CanvasElement } from "../../types/element.ts";

const MAX_HISTORY = 50;

interface HistoryState {
  undoStack: CanvasElement[][];
  redoStack: CanvasElement[][];

  pushUndo: (snapshot: CanvasElement[]) => void;
  undo: () => CanvasElement[] | null;
  redo: () => CanvasElement[] | null;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  undoStack: [],
  redoStack: [],

  pushUndo: (snapshot) =>
    set((state) => ({
      undoStack: [...state.undoStack.slice(-(MAX_HISTORY - 1)), snapshot],
      redoStack: [],
    })),

  undo: () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return null;
    const snapshot = undoStack[undoStack.length - 1]!;
    set((state) => ({
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, snapshot],
    }));
    return snapshot;
  },

  redo: () => {
    const { redoStack } = get();
    if (redoStack.length === 0) return null;
    const snapshot = redoStack[redoStack.length - 1]!;
    set((state) => ({
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack, snapshot],
    }));
    return snapshot;
  },

  clearHistory: () => set({ undoStack: [], redoStack: [] }),
}));
