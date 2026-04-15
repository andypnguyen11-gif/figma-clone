/**
 * LockOverlay — renders coloured outlines and owner-name labels
 * on elements that are locked by other users.
 *
 * Reads from lockStore and elementStore to determine which elements
 * to decorate. Elements locked by the current user are not highlighted
 * (they already have the standard selection indicator).
 */
import React, { useMemo } from "react";
import { Group, Rect, Text } from "react-konva";
import { useLockStore } from "../../features/locking/lockStore.ts";
import { useElementStore } from "../../features/elements/elementStore.ts";

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
      x: number;
      y: number;
      width: number;
      height: number;
    }> = [];

    locks.forEach((lock, elementId) => {
      if (lock.userId === currentUserId) return;
      const el = elements.get(elementId);
      if (!el) return;
      result.push({
        elementId,
        userName: lock.userName,
        color: lock.color,
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
      });
    });

    return result;
  }, [locks, elements, currentUserId]);

  if (otherLocks.length === 0) return null;

  return (
    <>
      {otherLocks.map((lock) => (
        <Group key={lock.elementId} x={lock.x} y={lock.y}>
          <Rect
            width={lock.width}
            height={lock.height}
            stroke={lock.color}
            strokeWidth={2}
            dash={[6, 3]}
            fill="transparent"
            listening={false}
          />
          <Text
            text={lock.userName}
            x={0}
            y={-18}
            fontSize={11}
            fill="#FFFFFF"
            padding={2}
          />
        </Group>
      ))}
    </>
  );
});
