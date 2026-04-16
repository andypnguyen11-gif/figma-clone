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

export interface LockHeartbeatEvent {
  event: "lock:heartbeat";
  element_id: string;
}

// ── Presence events ─────────────────────────────────────────────────

export interface CursorMoveEvent {
  event: "cursor:move";
  userId: string;
  userName: string;
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

export interface UserLeftEvent {
  event: "user:left";
  userId: string;
}

// ── Union type ──────────────────────────────────────────────────────

export type WebSocketEvent =
  | ElementCreatedEvent
  | ElementUpdatedEvent
  | ElementDeletedEvent
  | LockAcquireEvent
  | LockReleaseEvent
  | LockDeniedEvent
  | LockHeartbeatEvent
  | CursorMoveEvent
  | UserJoinedEvent
  | UserLeftEvent;
