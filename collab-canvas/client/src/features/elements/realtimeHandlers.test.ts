import { describe, it, expect, beforeEach, vi } from "vitest";
import { processCanvasWsMessage } from "./realtimeHandlers.ts";
import { useElementStore } from "./elementStore.ts";
import { useLockStore } from "../locking/lockStore.ts";

const sampleDto = {
  id: "e-remote",
  canvas_id: "c1",
  element_type: "rectangle",
  x: 1,
  y: 2,
  width: 10,
  height: 10,
  fill: "#fff",
  stroke: "#000",
  stroke_width: 1,
  opacity: 1,
  rotation: 0,
  z_index: 0,
  text_content: null,
  font_size: null,
  text_color: null,
  created_at: "2026-01-02T00:00:00Z",
  updated_at: "2026-01-02T00:00:00Z",
};

describe("processCanvasWsMessage", () => {
  beforeEach(() => {
    useElementStore.setState({
      elements: new Map(),
      selectedElementId: null,
      editingTextElementId: null,
    });
    useLockStore.getState().clearLocks();
  });

  it("upserts on element:created", () => {
    processCanvasWsMessage(
      { event: "element:created", element: sampleDto },
      {},
    );
    expect(useElementStore.getState().getElement("e-remote")).toMatchObject({
      id: "e-remote",
      x: 1,
    });
  });

  it("removes on element:deleted", () => {
    useElementStore.getState().addElement({
      id: "e-remote",
      canvasId: "c1",
      elementType: "rectangle",
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      fill: "#fff",
      stroke: "#000",
      strokeWidth: 1,
      opacity: 1,
      rotation: 0,
      zIndex: 0,
      textContent: null,
      fontSize: null,
      textColor: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    });

    processCanvasWsMessage(
      { event: "element:deleted", element_id: "e-remote" },
      {},
    );
    expect(useElementStore.getState().getElement("e-remote")).toBeUndefined();
  });

  it("replaces locks from lock:snapshot", () => {
    useLockStore.getState().setLock("old", {
      userId: "u0",
      userName: "Old",
      color: "#000",
    });
    processCanvasWsMessage(
      {
        event: "lock:snapshot",
        canvas_id: "c1",
        locks: [
          {
            element_id: "e1",
            user_id: "u1",
            user_name: "Alice",
            color: "#abc",
          },
        ],
      },
      {},
    );
    expect(useLockStore.getState().locks.has("old")).toBe(false);
    expect(useLockStore.getState().locks.get("e1")).toEqual({
      userId: "u1",
      userName: "Alice",
      color: "#abc",
    });
  });

  it("sets lock on lock:acquire", () => {
    processCanvasWsMessage(
      {
        event: "lock:acquire",
        element_id: "e1",
        user_id: "u1",
        user_name: "Alice",
        color: "#abc",
      },
      {},
    );
    expect(useLockStore.getState().locks.get("e1")).toEqual({
      userId: "u1",
      userName: "Alice",
      color: "#abc",
    });
  });

  it("invokes onLockDenied for lock:denied", () => {
    const onLockDenied = vi.fn();
    processCanvasWsMessage(
      { event: "lock:denied", element_id: "xe" },
      { onLockDenied },
    );
    expect(onLockDenied).toHaveBeenCalledWith("xe");
  });

  it("invokes onRemoteElementPersisted when merging element from server", () => {
    const onRemoteElementPersisted = vi.fn();
    processCanvasWsMessage(
      { event: "element:created", element: sampleDto },
      { onRemoteElementPersisted },
    );
    expect(onRemoteElementPersisted).toHaveBeenCalledWith("e-remote");
  });
});
