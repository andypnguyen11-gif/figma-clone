/**
 * Tests for useReconnect — refreshes REST state after WS recovery and clears overlays.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useReconnect } from "./useReconnect.ts";
import { useLockStore } from "../features/locking/lockStore.ts";
import { usePresenceStore } from "../features/presence/presenceStore.ts";

describe("useReconnect", () => {
  beforeEach(() => {
    useLockStore.getState().clearLocks();
    usePresenceStore.getState().clearCursors();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("onConnectionLost clears locks and presence cursors", () => {
    useLockStore.getState().setLock("e1", {
      userId: "u",
      userName: "X",
      color: "#000",
    });
    usePresenceStore.getState().setCursor({
      userId: "u2",
      userName: "Y",
      color: "#111",
      x: 1,
      y: 2,
    });

    const { result } = renderHook(() =>
      useReconnect({
        refreshState: vi.fn(),
      }),
    );

    act(() => {
      result.current.onConnectionLost();
    });

    expect(useLockStore.getState().locks.size).toBe(0);
    expect(usePresenceStore.getState().cursors.size).toBe(0);
  });

  it("onReconnect invokes refreshState", async () => {
    const refreshState = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useReconnect({
        refreshState,
      }),
    );

    await act(async () => {
      await result.current.onReconnect();
    });

    expect(refreshState).toHaveBeenCalledOnce();
  });
});
