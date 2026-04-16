/**
 * App shell — renders the canvas viewport with the drawing toolbar,
 * property panel, and global keyboard shortcuts.
 *
 * Seeds demo elements for local development until the full auth →
 * canvas load → API fetch flow is wired up (PR-12).
 */
import { useEffect } from "react";
import CanvasViewport from "./components/canvas/CanvasViewport.tsx";
import { Toolbar } from "./components/toolbar/Toolbar.tsx";
import { PropertyPanel } from "./components/properties/PropertyPanel.tsx";
import { useElementStore } from "./features/elements/elementStore.ts";
import { performUndo, performRedo, deleteSelectedElement } from "./features/history/useUndoRedo.ts";
import type { CanvasElement } from "./types/element.ts";

const demoElements: CanvasElement[] = [
  {
    id: "demo-rect",
    canvasId: "demo",
    elementType: "rectangle",
    x: 100,
    y: 100,
    width: 200,
    height: 120,
    fill: "#3B82F6",
    stroke: "#1E40AF",
    strokeWidth: 2,
    opacity: 1,
    rotation: 0,
    zIndex: 0,
    textContent: null,
    fontSize: null,
    textColor: null,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "demo-circle",
    canvasId: "demo",
    elementType: "circle",
    x: 450,
    y: 200,
    width: 100,
    height: 100,
    fill: "#EF4444",
    stroke: "#991B1B",
    strokeWidth: 2,
    opacity: 0.9,
    rotation: 0,
    zIndex: 1,
    textContent: null,
    fontSize: null,
    textColor: null,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "demo-triangle",
    canvasId: "demo",
    elementType: "triangle",
    x: 300,
    y: 350,
    width: 120,
    height: 120,
    fill: "#10B981",
    stroke: "#065F46",
    strokeWidth: 2,
    opacity: 1,
    rotation: 0,
    zIndex: 2,
    textContent: null,
    fontSize: null,
    textColor: null,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "demo-text",
    canvasId: "demo",
    elementType: "text",
    x: 100,
    y: 300,
    width: 300,
    height: 40,
    fill: "#FFFFFF",
    stroke: "transparent",
    strokeWidth: 0,
    opacity: 1,
    rotation: 0,
    zIndex: 3,
    textContent: "Collab Canvas",
    fontSize: 28,
    textColor: "#FFFFFF",
    createdAt: "",
    updatedAt: "",
  },
];

function App() {
  const setElements = useElementStore((s) => s.setElements);

  useEffect(() => {
    setElements(demoElements);
  }, [setElements]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      if ((e.key === "Delete" || e.key === "Backspace") && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        deleteSelectedElement();
        return;
      }

      if (e.key === "z" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        performRedo();
        return;
      }

      if (e.key === "z" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault();
        performUndo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <CanvasViewport />
      <Toolbar />
      <PropertyPanel />
    </>
  );
}

export default App;
