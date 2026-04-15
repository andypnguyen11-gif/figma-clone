/**
 * SelectionOverlay — Konva Transformer that wraps the currently
 * selected shape node to provide move/resize handles.
 *
 * Attaches to a shape node ref via useEffect. On transformEnd the
 * new position, size, and rotation are committed to the element store.
 * The overlay is hidden when no element is selected.
 */
import { useEffect, useRef } from "react";
import { Transformer } from "react-konva";
import type Konva from "konva";
import { useElementStore } from "../../features/elements/elementStore.ts";
import { useHistoryStore } from "../../features/history/historyStore.ts";

interface SelectionOverlayProps {
  /** Ref map from element IDs → Konva nodes, populated by KonvaShapes. */
  shapeRefs: React.RefObject<Map<string, Konva.Node>>;
}

export default function SelectionOverlay({ shapeRefs }: SelectionOverlayProps) {
  const trRef = useRef<Konva.Transformer>(null);
  const selectedElementId = useElementStore((s) => s.selectedElementId);
  const updateElement = useElementStore((s) => s.updateElement);
  const getAllElements = useElementStore((s) => s.getAllElements);
  const pushUndo = useHistoryStore((s) => s.pushUndo);

  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;

    if (selectedElementId && shapeRefs.current) {
      const node = shapeRefs.current.get(selectedElementId);
      if (node) {
        tr.nodes([node]);
        tr.getLayer()?.batchDraw();
        return;
      }
    }
    tr.nodes([]);
    tr.getLayer()?.batchDraw();
  }, [selectedElementId, shapeRefs]);

  const handleTransformEnd = () => {
    if (!selectedElementId || !shapeRefs.current) return;
    const node = shapeRefs.current.get(selectedElementId);
    if (!node) return;

    pushUndo(getAllElements());

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    updateElement(selectedElementId, {
      x: node.x(),
      y: node.y(),
      width: Math.max(node.width() * scaleX, 5),
      height: Math.max(node.height() * scaleY, 5),
      rotation: node.rotation(),
    });
  };

  return (
    <Transformer
      ref={trRef}
      rotateEnabled
      enabledAnchors={[
        "top-left",
        "top-right",
        "bottom-left",
        "bottom-right",
        "middle-left",
        "middle-right",
        "top-center",
        "bottom-center",
      ]}
      boundBoxFunc={(_oldBox, newBox) => {
        if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
          return _oldBox;
        }
        return newBox;
      }}
      onTransformEnd={handleTransformEnd}
      borderStroke="#0D99FF"
      anchorFill="#0D99FF"
      anchorStroke="#FFFFFF"
      anchorSize={8}
      anchorCornerRadius={2}
    />
  );
}
