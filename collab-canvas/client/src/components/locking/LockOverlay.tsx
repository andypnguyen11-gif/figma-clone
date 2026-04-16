/**
 * LockOverlay — renders coloured outlines and owner-name labels
 * on elements that are locked by other users.
 *
 * Reads from lockStore and elementStore to determine which elements
 * to decorate. Elements locked by the current user are not highlighted
 * (they already have the standard selection indicator).
 *
 * Circles and triangles use the same center + radius model as {@link KonvaShapes}
 * (``Circle`` / ``RegularPolygon``). Rectangles, lines, and text use a bounding
 * ``Rect``. Using a top-left ``Rect`` for circle/triangle misaligns the outline.
 */
import React, { useMemo } from "react";
import { Circle, Group, Rect, RegularPolygon, Text } from "react-konva";
import { useLockStore } from "../../features/locking/lockStore.ts";
import { useElementStore } from "../../features/elements/elementStore.ts";
import type { ElementType } from "../../types/element.ts";
import { triangleRadius } from "../../utils/geometry.ts";

interface LockOverlayProps {
  currentUserId: string;
}

export const LockOverlay = React.memo(function LockOverlay({
  currentUserId,
}: LockOverlayProps) {
  const locks = useLockStore((s) => s.locks);
  const elements = useElementStore((s) => s.elements);

  const otherLocks = useMemo(() => {
    const result: Array<{
      elementId: string;
      userName: string;
      color: string;
      elementType: ElementType;
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      /** Circle / triangle: Konva center + radius — matches KonvaShapes. */
      radius: number;
    }> = [];

    locks.forEach((lock, elementId) => {
      if (lock.userId === currentUserId) return;
      const el = elements.get(elementId);
      if (!el) return;
      result.push({
        elementId,
        userName: lock.userName,
        color: lock.color,
        elementType: el.elementType,
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        rotation: el.rotation,
        radius: triangleRadius(el.width, el.height),
      });
    });

    return result;
  }, [locks, elements, currentUserId]);

  if (otherLocks.length === 0) return null;

  return (
    <>
      {otherLocks.map((lock) => {
        const nameY =
          lock.elementType === "rectangle" ||
          lock.elementType === "line" ||
          lock.elementType === "text"
            ? -18
            : -lock.radius - 18;

        return (
          <Group
            key={lock.elementId}
            x={lock.x}
            y={lock.y}
            rotation={lock.rotation}
          >
            {lock.elementType === "circle" ? (
              <Circle
                radius={lock.radius}
                stroke={lock.color}
                strokeWidth={2}
                dash={[6, 3]}
                fill="transparent"
                listening={false}
              />
            ) : lock.elementType === "triangle" ? (
              <RegularPolygon
                sides={3}
                radius={lock.radius}
                stroke={lock.color}
                strokeWidth={2}
                dash={[6, 3]}
                fill="transparent"
                listening={false}
              />
            ) : (
              <Rect
                width={lock.width}
                height={lock.height}
                stroke={lock.color}
                strokeWidth={2}
                dash={[6, 3]}
                fill="transparent"
                listening={false}
              />
            )}
            <Text
              text={lock.userName}
              x={0}
              y={nameY}
              fontSize={11}
              fill="#FFFFFF"
              padding={2}
            />
          </Group>
        );
      })}
    </>
  );
});
