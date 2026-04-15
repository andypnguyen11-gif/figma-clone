/**
 * CanvasViewport — the top-level react-konva Stage with pan and zoom.
 *
 * Pan: drag the stage background (not a shape) to move the viewport.
 * Zoom: scroll wheel scales the stage around the pointer position.
 * Elements are read from the element store and rendered via KonvaShapes.
 * Selection is managed through the element store's selectedElementId.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { Layer, Stage } from "react-konva";
import type Konva from "konva";
import { useElementStore } from "../../features/elements/elementStore.ts";
import { useCanvasStore } from "../../features/canvas/canvasStore.ts";
import { renderShape } from "./KonvaShapes.tsx";
import { clampScale } from "../../utils/geometry.ts";

/** Zoom speed — higher = faster zoom per scroll tick. */
const ZOOM_FACTOR = 1.1;

export default function CanvasViewport() {
  const stageRef = useRef<Konva.Stage>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const elementMap = useElementStore((s) => s.elements);
  const elements = useMemo(() => Array.from(elementMap.values()), [elementMap]);
  const selectedElementId = useElementStore((s) => s.selectedElementId);
  const setSelectedElementId = useElementStore((s) => s.setSelectedElementId);
  const selectedTool = useCanvasStore((s) => s.selectedTool);

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

  /** Update viewport position after a drag. */
  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    setPosition({ x: e.target.x(), y: e.target.y() });
  }, []);

  /** Click on empty canvas area deselects the current element. */
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target === stageRef.current) {
        setSelectedElementId(null);
      }
    },
    [setSelectedElementId],
  );

  /** Select an element when clicked (only in select mode). */
  const handleElementSelect = useCallback(
    (id: string) => {
      if (selectedTool === "select") {
        setSelectedElementId(id);
      }
    },
    [selectedTool, setSelectedElementId],
  );

  /** Sort elements by z-index so higher values render on top. */
  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <Stage
      ref={stageRef}
      width={window.innerWidth}
      height={window.innerHeight}
      scaleX={scale}
      scaleY={scale}
      x={position.x}
      y={position.y}
      draggable
      onWheel={handleWheel}
      onDragEnd={handleDragEnd}
      onClick={handleStageClick}
      onTap={handleStageClick}
      style={{ backgroundColor: "#1e1e1e", cursor: "default" }}
    >
      <Layer>
        {sortedElements.map((element) =>
          renderShape(
            element,
            element.id === selectedElementId,
            handleElementSelect,
          ),
        )}
      </Layer>
    </Stage>
  );
}
