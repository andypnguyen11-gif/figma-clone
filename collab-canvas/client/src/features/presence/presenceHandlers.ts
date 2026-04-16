/**
 * Applies server WebSocket presence payloads (cursor moves, user left) to the
 * presence store. Runs outside React so it can run from socket ``onMessage``.
 *
 * Server broadcasts use snake_case keys (``user_id``, ``user_name``) and echo
 * ``cursor:move`` to every socket including the sender — we skip rows for
 * ``currentUserId`` so local pointers are not duplicated.
 */
import { usePresenceStore } from "./presenceStore.ts";

export interface PresenceHandlersContext {
  currentUserId: string;
}

export function processPresenceWsMessage(
  raw: unknown,
  ctx: PresenceHandlersContext,
): void {
  if (typeof raw !== "object" || raw === null || !("event" in raw)) return;
  const msg = raw as Record<string, unknown>;
  const event = msg.event;
  if (typeof event !== "string") return;

  if (event === "cursor:move") {
    const userId = msg.user_id;
    const userName = msg.user_name;
    const color = msg.color;
    const x = msg.x;
    const y = msg.y;
    if (
      typeof userId !== "string" ||
      typeof userName !== "string" ||
      typeof color !== "string" ||
      typeof x !== "number" ||
      typeof y !== "number"
    ) {
      return;
    }
    if (userId === ctx.currentUserId) return;
    usePresenceStore.getState().setCursor({
      userId,
      userName,
      color,
      x,
      y,
    });
    return;
  }

  if (event === "user:left") {
    const userId = msg.user_id;
    if (typeof userId === "string") {
      usePresenceStore.getState().removeCursor(userId);
    }
  }
}
