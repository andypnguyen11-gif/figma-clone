/**
 * CanvasViewport — the top-level react-konva Stage with pan, zoom,
 * shape creation, selection, drag/resize, and inline text editing.
 *
 * Pan: click-drag on empty space to move the viewport (manual, not
 *   Konva's built-in Stage.draggable, which can't distinguish shapes
 *   from background).
 * Zoom: scroll wheel scales the stage around the pointer position.
 * Creation: with a drawing tool active, click or click-drag to place
 *   a new shape. After creation the tool reverts to "select" and the
 *   new element is selected.
 * Selection: click a shape in select mode to select it, gaining
 *   move/resize via the Transformer overlay.
 * Text editing: double-click a text element to open the inline editor.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { Circle, Layer, Line, Rect, RegularPolygon, Stage } from "react-konva";
import type Konva from "konva";
import { useElementStore } from "../../features/elements/elementStore.ts";
import { useCanvasStore } from "../../features/canvas/canvasStore.ts";
import { useAuthStore } from "../../features/auth/authStore.ts";
import { useHistoryStore } from "../../features/history/historyStore.ts";
import { renderShape } from "./KonvaShapes.tsx";
import { clampScale, screenToCanvas, triangleRadius } from "../../utils/geometry.ts";
import type { Point } from "../../utils/geometry.ts";
import {
  createShapeElement,
  createShapeFromDrag,
} from "./interactionHandlers.ts";
import SelectionOverlay from "./SelectionOverlay.tsx";
import { InlineTextEditor } from "./InlineTextEditor.tsx";
import { LockOverlay } from "../locking/LockOverlay.tsx";

/** Zoom speed — higher = faster zoom per scroll tick. */
const ZOOM_FACTOR = 1.1;

/** Distance in px the mouse must move to be considered a drag (not a click). */
const DRAG_THRESHOLD = 4;

interface DrawingState {
  startCanvas: Point;
  startScreen: Point;
  currentCanvas: Point;
}

export default function CanvasViewport() {
  const stageRef = useRef<Konva.Stage>(null);
  const shapeRefs = useRef<Map<string, Konva.Node>>(new Map());
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 });
  const [drawing, setDrawing] = useState<DrawingState | null>(null);
  const editingTextId = useElementStore((s) => s.editingTextElementId);
  const setEditingTextId = useElementStore((s) => s.setEditingTextElementId);

  /**
   * Manual pan tracking. We don't use Stage.draggable because it
   * captures drag events even when the pointer is over a shape,
   * causing the entire canvas to pan when the user tries to
   * click-select or drag an individual element.
   */
  const isPanning = useRef(false);
  const lastPanPointer = useRef<Point | null>(null);

  const elementMap = useElementStore((s) => s.elements);
  const elements = useMemo(() => Array.from(elementMap.values()), [elementMap]);
  const selectedElementId = useElementStore((s) => s.selectedElementId);
  const setSelectedElementId = useElementStore((s) => s.setSelectedElementId);
  const addElement = useElementStore((s) => s.addElement);
  const updateElement = useElementStore((s) => s.updateElement);
  const getAllElements = useElementStore((s) => s.getAllElements);
  const selectedTool = useCanvasStore((s) => s.selectedTool);
  const setSelectedTool = useCanvasStore((s) => s.setSelectedTool);
  const pushUndo = useHistoryStore((s) => s.pushUndo);
  const canvasId = useCanvasStore((s) => s.canvas?.id) ?? "local";
  const currentUserId = useAuthStore((s) => s.user?.id ?? "");

  const isDrawingTool = selectedTool !== "select";

  /** Register / unregister a Konva node ref for a shape. */
  const registerRef = useCallback(
    (id: string, node: Konva.Node | null) => {
      if (node) {
        shapeRefs.current.set(id, node);
      } else {
        shapeRefs.current.delete(id);
      }
    },
    [],
  );

  /** Zoom towards the pointer position on scroll. */
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const oldScale = scale;
      const direction = e.evt.deltaY < 0 ? 1 : -1;
      const newScale = clampScale(
        direction > 0 ? oldScale * ZOOM_FACTOR : oldScale / ZOOM_FACTOR,
      );

      const mousePointTo = {
        x: (pointer.x - position.x) / oldScale,
        y: (pointer.y - position.y) / oldScale,
      };

      setScale(newScale);
      setPosition({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
    },
    [scale, position],
  );

  /**
   * Unified mousedown: routes to panning, shape creation, or does
   * nothing (letting the shape's own click/drag handlers take over).
   */
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;

      const clickedOnEmpty = e.target === stage;
      if (!clickedOnEmpty) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      if (isDrawingTool) {
        const canvasPos = screenToCanvas(pointer, position, scale);
        setDrawing({ startCanvas: canvasPos, startScreen: pointer, currentCanvas: canvasPos });
      } else {
        isPanning.current = true;
        lastPanPointer.current = pointer;
      }
    },
    [isDrawingTool, position, scale],
  );

  /**
   * Mousemove: update the stage position imperatively during a pan,
   * or update the drawing preview bounds during shape creation.
   */
  const handleMouseMove = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      if (isPanning.current && lastPanPointer.current) {
        const dx = pointer.x - lastPanPointer.current.x;
        const dy = pointer.y - lastPanPointer.current.y;
        stage.position({
          x: stage.x() + dx,
          y: stage.y() + dy,
        });
        stage.batchDraw();
        lastPanPointer.current = pointer;
        return;
      }

      if (drawing) {
        const canvasPos = screenToCanvas(pointer, position, scale);
        setDrawing((prev) =>
          prev ? { ...prev, currentCanvas: canvasPos } : null,
        );
      }
    },
    [drawing, position, scale],
  );

  /**
   * Mouseup: finalise panning (commit position to state) or
   * finalise shape creation.
   */
  const handleMouseUp = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      /* ---------- end pan ---------- */
      if (isPanning.current) {
        isPanning.current = false;
        lastPanPointer.current = null;
        const stage = stageRef.current;
        if (stage) {
          setPosition({ x: stage.x(), y: stage.y() });
        }
        return;
      }

      /* ---------- end shape creation ---------- */
      if (!drawing || !isDrawingTool) return;

      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const endCanvas = screenToCanvas(pointer, position, scale);

      const dx = Math.abs(pointer.x - drawing.startScreen.x);
      const dy = Math.abs(pointer.y - drawing.startScreen.y);
      const wasDrag = dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD;

      pushUndo(getAllElements());

      let newElement;
      if (wasDrag) {
        newElement = createShapeFromDrag(
          selectedTool as Exclude<typeof selectedTool, "select">,
          drawing.startCanvas,
          endCanvas,
          canvasId,
        );
      } else {
        newElement = createShapeElement(
          selectedTool as Exclude<typeof selectedTool, "select">,
          drawing.startCanvas,
          canvasId,
        );
      }

      addElement(newElement);
      setSelectedElementId(newElement.id);
      setSelectedTool("select");
      setDrawing(null);

      if (newElement.elementType === "text") {
        setEditingTextId(newElement.id);
      }

      e.evt.preventDefault();
    },
    [
      drawing,
      isDrawingTool,
      selectedTool,
      position,
      scale,
      canvasId,
      addElement,
      setSelectedElementId,
      setSelectedTool,
      pushUndo,
      getAllElements,
      setEditingTextId,
    ],
  );

  /** Click/tap on empty canvas area deselects the current element. */
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (isDrawingTool) return;
      if (e.target === stageRef.current) {
        setSelectedElementId(null);
        setEditingTextId(null);
      }
    },
    [setSelectedElementId, setEditingTextId, isDrawingTool],
  );

  /** Select an element when clicked (only in select mode). */
  const handleElementSelect = useCallback(
    (id: string) => {
      if (selectedTool === "select") {
        setSelectedElementId(id);
        setEditingTextId(null);
      }
    },
    [selectedTool, setSelectedElementId],
  );

  /** Commit position change after dragging a shape. */
  const handleElementDragEnd = useCallback(
    (id: string, x: number, y: number) => {
      pushUndo(getAllElements());
      updateElement(id, { x, y });
    },
    [updateElement, pushUndo, getAllElements],
  );

  /** Open inline text editor on double-click. */
  const handleElementDblClick = useCallback(
    (id: string) => {
      const el = useElementStore.getState().getElement(id);
      if (el?.elementType === "text") {
        setSelectedElementId(id);
        setEditingTextId(id);
      }
    },
    [setSelectedElementId, setEditingTextId],
  );

  const removeElement = useElementStore((s) => s.removeElement);

  /** While typing, push text into the store so debounced save + realtime sync run before blur. */
  const handleTextDraftChange = useCallback(
    (elementId: string, text: string) => {
      updateElement(elementId, { textContent: text });
    },
    [updateElement],
  );

  /** Commit text edit and close the editor; remove if left empty. */
  const handleTextComplete = useCallback(
    (elementId: string, text: string) => {
      pushUndo(getAllElements());
      if (text.trim() === "") {
        removeElement(elementId);
        setSelectedElementId(null);
      } else {
        updateElement(elementId, { textContent: text });
      }
      setEditingTextId(null);
    },
    [updateElement, removeElement, pushUndo, getAllElements, setSelectedElementId],
  );

  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  const editingElement =
    editingTextId ? useElementStore.getState().getElement(editingTextId) : null;

  const cursorStyle = isDrawingTool ? "crosshair" : "default";

  const preview = useMemo(() => {
    if (!drawing || !isDrawingTool) return null;
    const { startCanvas, currentCanvas } = drawing;
    const x = Math.min(startCanvas.x, currentCanvas.x);
    const y = Math.min(startCanvas.y, currentCanvas.y);
    const w = Math.abs(currentCanvas.x - startCanvas.x);
    const h = Math.abs(currentCanvas.y - startCanvas.y);
    if (w < 2 && h < 2) return null;

    const shared = {
      x,
      y,
      stroke: "#0D99FF",
      strokeWidth: 1,
      fill: "rgba(13,153,255,0.08)",
      dash: [6, 3],
      listening: false,
    };

    switch (selectedTool) {
      case "rectangle":
        return <Rect {...shared} width={w} height={h} />;
      case "circle":
        return (
          <Circle
            {...shared}
            x={x + w / 2}
            y={y + h / 2}
            radius={Math.max(w, h) / 2}
          />
        );
      case "line":
        return (
          <Line
            {...shared}
            points={[startCanvas.x, startCanvas.y, currentCanvas.x, currentCanvas.y]}
            x={0}
            y={0}
          />
        );
      case "triangle":
        return (
          <RegularPolygon
            {...shared}
            x={x + w / 2}
            y={y + h / 2}
            sides={3}
            radius={triangleRadius(w, h)}
          />
        );
      case "text":
        return <Rect {...shared} width={w} height={h} />;
      default:
        return null;
    }
  }, [drawing, isDrawingTool, selectedTool]);

  return (
    <>
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ backgroundColor: "#1e1e1e", cursor: cursorStyle }}
      >
        <Layer>
          {sortedElements.map((element) =>
            renderShape(
              element,
              element.id === selectedElementId,
              selectedTool === "select" && element.id === selectedElementId,
              handleElementSelect,
              handleElementDragEnd,
              handleElementDblClick,
              registerRef,
              editingTextId,
            ),
          )}
          {preview}
          <SelectionOverlay shapeRefs={shapeRefs} />
          <LockOverlay currentUserId={currentUserId} />
        </Layer>
      </Stage>

      {editingElement && (
        <InlineTextEditor
          elementId={editingElement.id}
          initialText={editingElement.textContent ?? ""}
          x={editingElement.x}
          y={editingElement.y}
          width={editingElement.width}
          height={editingElement.height}
          fontSize={editingElement.fontSize ?? 16}
          color={editingElement.textColor ?? "#FFFFFF"}
          scale={scale}
          stagePosition={position}
          onDraftChange={handleTextDraftChange}
          onComplete={handleTextComplete}
        />
      )}
    </>
  );
}
