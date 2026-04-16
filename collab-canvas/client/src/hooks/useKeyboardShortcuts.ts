/**
 * Global keyboard shortcut handler for the canvas editor.
 *
 * Binds a single `keydown` listener on `window` that dispatches:
 *   - Tool shortcuts (V/R/C/L/T) → switch active tool via canvasStore
 *   - Delete/Backspace → delete the selected element (undoable)
 *   - Ctrl/Cmd+Z → undo
 *   - Ctrl/Cmd+Shift+Z → redo
 *
 * Shortcuts are suppressed when the focus is inside an <input>,
 * <textarea>, or contenteditable element so that text entry is
 * not intercepted.
 */
import { useEffect } from "react";
import { useCanvasStore } from "../features/canvas/canvasStore.ts";
import { useElementStore } from "../features/elements/elementStore.ts";
import { performUndo, performRedo, deleteSelectedElement } from "../features/history/useUndoRedo.ts";
import type { ToolType } from "../types/canvas.ts";

const TOOL_KEY_MAP: Record<string, ToolType> = {
  v: "select",
  r: "rectangle",
  c: "circle",
  l: "line",
  t: "text",
};

function isTextInputFocused(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    target.isContentEditable ||
    target.getAttribute("contenteditable") === "true"
  );
}

/**
 * Attach global keyboard shortcuts for tool selection, delete,
 * undo, and redo. Call once from the app shell component.
 *
 * Cleans up the listener on unmount.
 */
export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (isTextInputFocused(e.target)) return;

      const hasModifier = e.metaKey || e.ctrlKey;

      if ((e.key === "Delete" || e.key === "Backspace") && !hasModifier) {
        e.preventDefault();
        deleteSelectedElement();
        return;
      }

      if (e.key === "z" && hasModifier && e.shiftKey) {
        e.preventDefault();
        performRedo();
        return;
      }

      if (e.key === "z" && hasModifier && !e.shiftKey) {
        e.preventDefault();
        performUndo();
        return;
      }

      if (!hasModifier && !e.shiftKey && !e.altKey) {
        const tool = TOOL_KEY_MAP[e.key.toLowerCase()];
        if (tool) {
          e.preventDefault();
          useCanvasStore.getState().setSelectedTool(tool);
          useElementStore.getState().setSelectedElementId(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
