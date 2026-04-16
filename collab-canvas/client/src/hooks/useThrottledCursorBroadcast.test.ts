/**
 * Tests for throttled cursor:move outbound helper (PR-15 ~50ms throttle).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useThrottledCursorBroadcast } from "./useThrottledCursorBroadcast.ts";

describe("useThrottledCursorBroadcast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sends cursor:move at most once per interval when enabled", () => {
    const sendJson = vi.fn();
    const { result } = renderHook(() =>
      useThrottledCursorBroadcast(sendJson, true, 50),
    );

    act(() => {
      result.current(10, 20);
      result.current(11, 21);
      result.current(12, 22);
    });

    expect(sendJson).toHaveBeenCalledTimes(1);
    expect(sendJson).toHaveBeenCalledWith({
      event: "cursor:move",
      x: 10,
      y: 20,
    });

    act(() => {
      vi.advanceTimersByTime(50);
    });

    act(() => {
      result.current(100, 200);
    });

    expect(sendJson).toHaveBeenCalledTimes(2);
    expect(sendJson).toHaveBeenLastCalledWith({
      event: "cursor:move",
      x: 100,
      y: 200,
    });
  });

  it("no-ops when disabled", () => {
    const sendJson = vi.fn();
    const { result } = renderHook(() =>
      useThrottledCursorBroadcast(sendJson, false, 50),
    );

    act(() => {
      result.current(1, 2);
    });

    expect(sendJson).not.toHaveBeenCalled();
  });
});
