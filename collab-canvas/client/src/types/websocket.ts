/**
 * WebSocket event type definitions.
 *
 * Covers element mutations, lock lifecycle, and cursor presence.
 * Payload shapes mirror what the server broadcasts.
 */

import type { CanvasElement, ElementUpdatePayload } from "./element.ts";

// ── Element events ──────────────────────────────────────────────────

export interface ElementCreatedEvent {
  type: "element:created";
  element: CanvasElement;
}

export interface ElementUpdatedEvent {
  type: "element:updated";
  elementId: string;
  changes: ElementUpdatePayload;
}

export interface ElementDeletedEvent {
  type: "element:deleted";
  elementId: string;
}

// ── Lock events ─────────────────────────────────────────────────────

export interface LockAcquireEvent {
  type: "lock:acquire";
  elementId: string;
  userId: string;
  userName: string;
  color: string;
}

export interface LockReleaseEvent {
  type: "lock:release";
  elementId: string;
}

export interface LockDeniedEvent {
  type: "lock:denied";
  elementId: string;
}

export interface LockHeartbeatEvent {
  type: "lock:heartbeat";
  elementId: string;
}

// ── Presence events ─────────────────────────────────────────────────

export interface CursorMoveEvent {
  type: "cursor:move";
  userId: string;
  userName: string;
  color: string;
  x: number;
  y: number;
}

export interface UserJoinedEvent {
  type: "user:joined";
  userId: string;
  userName: string;
  color: string;
}

export interface UserLeftEvent {
  type: "user:left";
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
