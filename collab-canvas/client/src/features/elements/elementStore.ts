/**
 * Element store — the source of truth for all shapes on the canvas.
 *
 * Stores elements as a Map keyed by element ID for O(1) lookups.
 * Tracks the currently selected element ID separately so selection
 * state doesn't trigger full-list re-renders.
 */
import { create } from "zustand";
import type { CanvasElement, ElementUpdatePayload } from "../../types/element.ts";

interface ElementState {
  elements: Map<string, CanvasElement>;
  selectedElementId: string | null;

  setElements: (elements: CanvasElement[]) => void;
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, changes: ElementUpdatePayload) => void;
  removeElement: (id: string) => void;
  setSelectedElementId: (id: string | null) => void;
  getElement: (id: string) => CanvasElement | undefined;
  getAllElements: () => CanvasElement[];
}

export const useElementStore = create<ElementState>((set, get) => ({
  elements: new Map(),
  selectedElementId: null,

  setElements: (elements) => {
    const map = new Map<string, CanvasElement>();
    for (const el of elements) {
      map.set(el.id, el);
    }
    set({ elements: map });
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
      return { elements: next, selectedElementId };
    }),

  setSelectedElementId: (id) => set({ selectedElementId: id }),

  getElement: (id) => get().elements.get(id),

  getAllElements: () => Array.from(get().elements.values()),
}));
