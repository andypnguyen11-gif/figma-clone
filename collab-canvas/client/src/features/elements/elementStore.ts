/**
 * Element store — the source of truth for all shapes on the canvas.
 *
 * Stores elements as a Map keyed by element ID for O(1) lookups.
 * Tracks the currently selected element ID separately so selection
 * state doesn't trigger full-list re-renders. ``editingTextElementId``
 * tracks inline text editing; it must remap on ``replaceElement`` when
 * a client UUID is replaced by a server id so the editor stays mounted.
 */
import { create } from "zustand";
import type { CanvasElement, ElementUpdatePayload } from "../../types/element.ts";

interface ElementState {
  elements: Map<string, CanvasElement>;
  selectedElementId: string | null;
  /** Element currently in inline Text edit mode (null if none). */
  editingTextElementId: string | null;

  setElements: (elements: CanvasElement[]) => void;
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, changes: ElementUpdatePayload) => void;
  removeElement: (id: string) => void;
  /** After POST create: remove local client id, insert server row, preserve selection if it was the old id. */
  replaceElement: (oldId: string, next: CanvasElement) => void;
  /** Merge full element from server or WS; drops stale rows by updatedAt. */
  upsertElement: (element: CanvasElement) => void;
  setSelectedElementId: (id: string | null) => void;
  setEditingTextElementId: (id: string | null) => void;
  getElement: (id: string) => CanvasElement | undefined;
  getAllElements: () => CanvasElement[];
}

export const useElementStore = create<ElementState>((set, get) => ({
  elements: new Map(),
  selectedElementId: null,
  editingTextElementId: null,

  setElements: (elements) => {
    const map = new Map<string, CanvasElement>();
    for (const el of elements) {
      map.set(el.id, el);
    }
    set({ elements: map, editingTextElementId: null });
  },

  addElement: (element) =>
    set((state) => {
      const next = new Map(state.elements);
      next.set(element.id, element);
      return { elements: next };
    }),

  updateElement: (id, changes) =>
    set((state) => {
      const existing = state.elements.get(id);
      if (!existing) return state;
      const next = new Map(state.elements);
      next.set(id, { ...existing, ...changes });
      return { elements: next };
    }),

  removeElement: (id) =>
    set((state) => {
      const next = new Map(state.elements);
      next.delete(id);
      const selectedElementId =
        state.selectedElementId === id ? null : state.selectedElementId;
      const editingTextElementId =
        state.editingTextElementId === id ? null : state.editingTextElementId;
      return { elements: next, selectedElementId, editingTextElementId };
    }),

  replaceElement: (oldId, next) =>
    set((state) => {
      const nextMap = new Map(state.elements);
      nextMap.delete(oldId);
      nextMap.set(next.id, next);
      const selectedElementId =
        state.selectedElementId === oldId ? next.id : state.selectedElementId;
      const editingTextElementId =
        state.editingTextElementId === oldId
          ? next.id
          : state.editingTextElementId;
      return { elements: nextMap, selectedElementId, editingTextElementId };
    }),

  upsertElement: (element) =>
    set((state) => {
      const prev = state.elements.get(element.id);
      if (
        prev &&
        new Date(element.updatedAt).getTime() <= new Date(prev.updatedAt).getTime()
      ) {
        return state;
      }
      const next = new Map(state.elements);
      next.set(element.id, element);
      return { elements: next };
    }),

  setSelectedElementId: (id) => set({ selectedElementId: id }),

  setEditingTextElementId: (id) => set({ editingTextElementId: id }),

  getElement: (id) => get().elements.get(id),

  getAllElements: () => Array.from(get().elements.values()),
}));
