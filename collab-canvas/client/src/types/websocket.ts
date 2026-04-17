/**
 * WebSocket event type definitions.
 *
 * Covers element mutations, lock lifecycle, and cursor presence.
 * Payload shapes mirror what the server broadcasts.
 */

import type { CanvasElement } from "./element.ts";

// ── Element events ──────────────────────────────────────────────────

export interface ElementCreatedEvent {
  event: "element:created";
  element: CanvasElement;
}

export interface ElementUpdatedEvent {
  event: "element:updated";
  element: CanvasElement;
}

export interface ElementDeletedEvent {
  event: "element:deleted";
  element_id: string;
}

// ── Lock events ─────────────────────────────────────────────────────

export interface LockAcquireEvent {
  event: "lock:acquire";
  element_id: string;
  user_id: string;
  user_name: string;
  color: string;
}

export interface LockReleaseEvent {
  event: "lock:release";
  element_id: string;
}

export interface LockDeniedEvent {
  event: "lock:denied";
  element_id: string;
}

/** Full lock set for this canvas (sent after ``connected`` / ``room:peers`` on join). */
export interface LockSnapshotEvent {
  event: "lock:snapshot";
  canvas_id: string;
  locks: Array<{
    element_id: string;
    user_id: string;
    user_name: string;
    color: string;
  }>;
}

export interface LockHeartbeatEvent {
  event: "lock:heartbeat";
  element_id: string;
}

// ── Presence events ─────────────────────────────────────────────────

/** Outbound: client → server (coordinates only). */
export interface CursorMoveOutbound {
  event: "cursor:move";
  x: number;
  y: number;
}

/**
 * Inbound broadcast: server mirrors snake_case keys (matches FastAPI JSON).
 */
export interface CursorMoveBroadcast {
  event: "cursor:move";
  canvas_id: string;
  user_id: string;
  user_name: string;
  color: string;
  x: number;
  y: number;
}

export interface UserJoinedEvent {
  event: "user:joined";
  userId: string;
  userName: string;
  color: string;
}

export interface UserLeftBroadcast {
  event: "user:left";
  canvas_id: string;
  user_id: string;
}

// ── Union type ──────────────────────────────────────────────────────

export type WebSocketEvent =
  | ElementCreatedEvent
  | ElementUpdatedEvent
  | ElementDeletedEvent
  | LockAcquireEvent
  | LockReleaseEvent
  | LockDeniedEvent
  | LockSnapshotEvent
  | LockHeartbeatEvent
  | CursorMoveBroadcast
  | UserJoinedEvent
  | UserLeftBroadcast;
