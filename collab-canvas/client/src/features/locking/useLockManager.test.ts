import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useLockManager } from "./useLockManager.ts";

describe("useLockManager", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sends lock:acquire when enabled with a selection", () => {
    const sendJson = vi.fn();
    renderHook(() =>
      useLockManager({
        enabled: true,
        sendJson,
        selectedElementId: "el-1",
      }),
    );

    expect(sendJson).toHaveBeenCalledWith({
      event: "lock:acquire",
      element_id: "el-1",
    });
  });

  it("sends lock:release on unmount", () => {
    const sendJson = vi.fn();
    const { unmount } = renderHook(() =>
      useLockManager({
        enabled: true,
        sendJson,
        selectedElementId: "el-1",
      }),
    );
    sendJson.mockClear();
    unmount();
    expect(sendJson).toHaveBeenCalledWith({
      event: "lock:release",
      element_id: "el-1",
    });
  });

  it("does not acquire when disabled", () => {
    const sendJson = vi.fn();
    renderHook(() =>
      useLockManager({
        enabled: false,
        sendJson,
        selectedElementId: "el-1",
      }),
    );
    expect(sendJson).not.toHaveBeenCalled();
  });

  it("schedules heartbeat at the configured interval", () => {
    const sendJson = vi.fn();
    renderHook(() =>
      useLockManager({
        enabled: true,
        sendJson,
        selectedElementId: "el-1",
      }),
    );
    sendJson.mockClear();
    vi.advanceTimersByTime(10_000);
    expect(sendJson).toHaveBeenCalledWith({
      event: "lock:heartbeat",
      element_id: "el-1",
    });
  });
});
