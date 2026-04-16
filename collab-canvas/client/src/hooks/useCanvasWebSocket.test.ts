/**
 * Tests for useCanvasWebSocket — lifecycle around connectCanvasSocket.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCanvasWebSocket } from "./useCanvasWebSocket.ts";

const connectCanvasSocket = vi.fn();
const disconnect = vi.fn();

vi.mock("../services/websocket/canvasSocket.ts", () => ({
  connectCanvasSocket: (...args: unknown[]) => connectCanvasSocket(...args),
}));

describe("useCanvasWebSocket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    disconnect.mockReset();
    connectCanvasSocket.mockReturnValue({ disconnect });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("does not connect when disabled", () => {
    renderHook(() =>
      useCanvasWebSocket({
        canvasId: "c1",
        token: "t",
        enabled: false,
      }),
    );
    expect(connectCanvasSocket).not.toHaveBeenCalled();
  });

  it("connects when enabled and invokes onMessage", async () => {
    const onMessage = vi.fn();
    renderHook(() =>
      useCanvasWebSocket({
        canvasId: "c1",
        token: "tok",
        enabled: true,
        onMessage,
      }),
    );
    expect(connectCanvasSocket).toHaveBeenCalledOnce();
    const opts = connectCanvasSocket.mock.calls[0][0];
    expect(opts.canvasId).toBe("c1");
    expect(opts.token).toBe("tok");
    (opts.onMessage as (m: unknown) => void)({ event: "connected" });
    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledWith({ event: "connected" });
    });
  });

  it("disconnects on unmount", () => {
    const { unmount } = renderHook(() =>
      useCanvasWebSocket({
        canvasId: "c1",
        token: "t",
        enabled: true,
      }),
    );
    unmount();
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
