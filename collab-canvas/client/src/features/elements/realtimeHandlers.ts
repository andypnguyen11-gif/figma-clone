/**
 * Applies server WebSocket payloads (element + lock events) to Zustand stores.
 *
 * Runs outside React; uses ``getState()`` so it can be invoked from a socket
 * ``onMessage`` callback without hook ordering issues.
 */
import type { ElementResponseDTO } from "../../services/api/elementsApi.ts";
import { useLockStore } from "../locking/lockStore.ts";
import { useElementStore } from "./elementStore.ts";
import { mapElementDtoToCanvasElement } from "./mapElementDto.ts";

export interface RealtimeHandlersContext {
  /** Selection is cleared when the server denies a lock (element held by another user). */
  onLockDenied?: (elementId: string) => void;
  /**
   * Called when an element payload from the server is merged in so the saver
   * knows this id is already persisted (avoids duplicate POST on debounced save).
   */
  onRemoteElementPersisted?: (elementId: string) => void;
}

function isElementDto(val: unknown): val is ElementResponseDTO {
  if (typeof val !== "object" || val === null) return false;
  const o = val as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.canvas_id === "string" &&
    typeof o.element_type === "string"
  );
}

export function processCanvasWsMessage(
  raw: unknown,
  ctx: RealtimeHandlersContext,
): void {
  if (typeof raw !== "object" || raw === null || !("event" in raw)) return;
  const msg = raw as Record<string, unknown>;
  const event = msg.event;
  if (typeof event !== "string") return;

  switch (event) {
    case "element:created":
    case "element:updated": {
      const el = msg.element;
      if (isElementDto(el)) {
        const mapped = mapElementDtoToCanvasElement(el);
        useElementStore.getState().upsertElement(mapped);
        ctx.onRemoteElementPersisted?.(mapped.id);
      }
      break;
    }
    case "element:deleted": {
      const id = msg.element_id;
      if (typeof id === "string") {
        useElementStore.getState().removeElement(id);
      }
      break;
    }
    case "lock:acquire": {
      const elementId = msg.element_id;
      const userId = msg.user_id;
      const userName = msg.user_name;
      const color = msg.color;
      if (
        typeof elementId === "string" &&
        typeof userId === "string" &&
        typeof userName === "string" &&
        typeof color === "string"
      ) {
        useLockStore.getState().setLock(elementId, {
          userId,
          userName,
          color,
        });
      }
      break;
    }
    case "lock:release": {
      const elementId = msg.element_id;
      if (typeof elementId === "string") {
        useLockStore.getState().releaseLock(elementId);
      }
      break;
    }
    case "lock:snapshot": {
      const locksRaw = msg.locks;
      useLockStore.getState().clearLocks();
      if (!Array.isArray(locksRaw)) break;
      for (const row of locksRaw) {
        if (typeof row !== "object" || row === null) continue;
        const r = row as Record<string, unknown>;
        const elementId = r.element_id;
        const userId = r.user_id;
        const userName = r.user_name;
        const color = r.color;
        if (
          typeof elementId === "string" &&
          typeof userId === "string" &&
          typeof userName === "string" &&
          typeof color === "string"
        ) {
          useLockStore.getState().setLock(elementId, {
            userId,
            userName,
            color,
          });
        }
      }
      break;
    }
    case "lock:denied": {
      const elementId = msg.element_id;
      if (typeof elementId === "string") {
        ctx.onLockDenied?.(elementId);
      }
      break;
    }
    default:
      break;
  }
}
