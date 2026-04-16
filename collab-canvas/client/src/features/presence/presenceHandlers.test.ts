/**
 * Tests for WebSocket presence payloads → presenceStore (cursor moves, user left).
 */
import { describe, it, expect, beforeEach } from "vitest";
import { usePresenceStore } from "./presenceStore.ts";
import { processPresenceWsMessage } from "./presenceHandlers.ts";

describe("processPresenceWsMessage", () => {
  beforeEach(() => {
    usePresenceStore.getState().clearCursors();
  });

  it("ignores non-object payloads", () => {
    processPresenceWsMessage(null, { currentUserId: "me" });
    expect(usePresenceStore.getState().cursors.size).toBe(0);
  });

  it("applies cursor:move for a remote user", () => {
    processPresenceWsMessage(
      {
        event: "cursor:move",
        canvas_id: "c1",
        user_id: "peer-1",
        user_name: "Bob",
        color: "#FF00AA",
        x: 120.5,
        y: 340,
      },
      { currentUserId: "me" },
    );

    const cur = usePresenceStore.getState().cursors.get("peer-1");
    expect(cur).toEqual({
      userId: "peer-1",
      userName: "Bob",
      color: "#FF00AA",
      x: 120.5,
      y: 340,
    });
  });

  it("does not add cursor for the current user (echo from broadcast)", () => {
    processPresenceWsMessage(
      {
        event: "cursor:move",
        user_id: "me",
        user_name: "Me",
        color: "#000",
        x: 1,
        y: 2,
      },
      { currentUserId: "me" },
    );

    expect(usePresenceStore.getState().cursors.size).toBe(0);
  });

  it("removes cursor on user:left", () => {
    usePresenceStore.getState().setCursor({
      userId: "peer-1",
      userName: "Bob",
      color: "#fff",
      x: 0,
      y: 0,
    });

    processPresenceWsMessage(
      { event: "user:left", user_id: "peer-1" },
      { currentUserId: "me" },
    );

    expect(usePresenceStore.getState().cursors.has("peer-1")).toBe(false);
  });

  it("ignores malformed cursor:move payloads", () => {
    processPresenceWsMessage(
      { event: "cursor:move", user_id: "u" },
      { currentUserId: "me" },
    );
    expect(usePresenceStore.getState().cursors.size).toBe(0);
  });
});
