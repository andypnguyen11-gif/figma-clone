/**
 * Undo/redo bridge — connects historyStore (stacks) with elementStore (state).
 *
 * Standalone functions are exported for direct use (keyboard shortcuts,
 * toolbar buttons). The useUndoRedo hook provides reactive canUndo/canRedo
 * booleans for UI state (button disabled state).
 *
 * Undo saves the current element state to the redo stack before restoring
 * the previous snapshot, so multi-step undo/redo works correctly.
 */
import { useHistoryStore } from "./historyStore.ts";
import { useElementStore } from "../elements/elementStore.ts";

/**
 * Capture the current element map as a snapshot on the undo stack.
 * Call this BEFORE performing a mutation so the pre-mutation state
 * is recoverable. Clears the redo stack (standard undo semantics).
 */
export function pushSnapshot(): void {
  const elements = useElementStore.getState().getAllElements();
  useHistoryStore.getState().pushUndo(elements);
}

/**
 * Pop the last undo snapshot and apply it to the element store.
 * The current element state is saved to the redo stack first so
 * the user can redo back to it.
 */
export function performUndo(): void {
  const { undoStack, redoStack } = useHistoryStore.getState();
  if (undoStack.length === 0) return;

  const currentElements = useElementStore.getState().getAllElements();
  const snapshot = undoStack[undoStack.length - 1]!;

  useHistoryStore.setState({
    undoStack: undoStack.slice(0, -1),
    redoStack: [...redoStack, currentElements],
  });

  useElementStore.getState().setElements(snapshot);
  useElementStore.getState().setSelectedElementId(null);
}

/**
 * Pop the last redo snapshot and apply it to the element store.
 * The current element state is saved back to the undo stack.
 */
export function performRedo(): void {
  const { undoStack, redoStack } = useHistoryStore.getState();
  if (redoStack.length === 0) return;

  const currentElements = useElementStore.getState().getAllElements();
  const snapshot = redoStack[redoStack.length - 1]!;

  useHistoryStore.setState({
    redoStack: redoStack.slice(0, -1),
    undoStack: [...undoStack, currentElements],
  });

  useElementStore.getState().setElements(snapshot);
  useElementStore.getState().setSelectedElementId(null);
}

/**
 * Delete the currently selected element. Pushes a snapshot first
 * so the deletion is undoable.
 */
export function deleteSelectedElement(): void {
  const { selectedElementId } = useElementStore.getState();
  if (!selectedElementId) return;

  pushSnapshot();
  useElementStore.getState().removeElement(selectedElementId);
}

/**
 * React hook that exposes undo/redo actions with reactive
 * canUndo/canRedo booleans for driving button disabled state.
 */
export function useUndoRedo() {
  const canUndo = useHistoryStore((s) => s.undoStack.length > 0);
  const canRedo = useHistoryStore((s) => s.redoStack.length > 0);
  const hasSelection = useElementStore((s) => s.selectedElementId !== null);

  return {
    undo: performUndo,
    redo: performRedo,
    deleteSelected: deleteSelectedElement,
    pushSnapshot,
    canUndo,
    canRedo,
    hasSelection,
  } as const;
}
