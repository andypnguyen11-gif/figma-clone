/**
 * PresenceLayer — renders remote collaborators' cursors in canvas coordinates
 * (same space as shapes). Local user is excluded defensively even if echoed.
 */
import React, { useMemo } from "react";
import { Circle, Group, Text } from "react-konva";
import { usePresenceStore } from "../../features/presence/presenceStore.ts";

interface PresenceLayerProps {
  currentUserId: string;
}

const CURSOR_RADIUS = 5;
const LABEL_OFFSET_Y = 14;

export const PresenceLayer = React.memo(function PresenceLayer({
  currentUserId,
}: PresenceLayerProps) {
  const cursors = usePresenceStore((s) => s.cursors);

  const remote = useMemo(() => {
    const list: Array<{
      userId: string;
      userName: string;
      color: string;
      x: number;
      y: number;
    }> = [];
    cursors.forEach((c) => {
      if (c.userId === currentUserId) return;
      list.push(c);
    });
    return list;
  }, [cursors, currentUserId]);

  if (remote.length === 0) return null;

  return (
    <>
      {remote.map((c) => (
        <Group key={c.userId} x={c.x} y={c.y} listening={false}>
          <Circle
            radius={CURSOR_RADIUS}
            fill={c.color}
            stroke="#FFFFFF"
            strokeWidth={1}
            listening={false}
          />
          <Text
            text={c.userName}
            x={4}
            y={LABEL_OFFSET_Y}
            fontSize={11}
            fill="#FFFFFF"
            padding={2}
            listening={false}
          />
        </Group>
      ))}
    </>
  );
});
