/**
 * Tests for useAutoSave — 10-minute interval auto-save hook.
 *
 * Verifies:
 * - setInterval fires the save callback at 10-minute intervals
 * - Timer resets when the page becomes visible again (visibilitychange)
 * - Timer is cleaned up on unmount
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAutoSave } from "./useAutoSave.ts";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const TEN_MINUTES = 10 * 60 * 1000;

describe("useAutoSave", () => {
  it("calls save callback after 10 minutes", () => {
    const save = vi.fn();
    renderHook(() => useAutoSave(save));

    expect(save).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(TEN_MINUTES);
    });

    expect(save).toHaveBeenCalledTimes(1);
  });

  it("calls save callback repeatedly every 10 minutes", () => {
    const save = vi.fn();
    renderHook(() => useAutoSave(save));

    act(() => {
      vi.advanceTimersByTime(TEN_MINUTES * 3);
    });

    expect(save).toHaveBeenCalledTimes(3);
  });

  it("does not save when disabled", () => {
    const save = vi.fn();
    renderHook(() => useAutoSave(save, false));

    act(() => {
      vi.advanceTimersByTime(TEN_MINUTES);
    });

    expect(save).not.toHaveBeenCalled();
  });

  it("clears interval on unmount", () => {
    const save = vi.fn();
    const { unmount } = renderHook(() => useAutoSave(save));

    unmount();

    act(() => {
      vi.advanceTimersByTime(TEN_MINUTES);
    });

    expect(save).not.toHaveBeenCalled();
  });

  it("resets timer on page visibility change back to visible", () => {
    const save = vi.fn();

    Object.defineProperty(document, "visibilityState", {
      writable: true,
      value: "visible",
    });

    renderHook(() => useAutoSave(save));

    act(() => {
      vi.advanceTimersByTime(TEN_MINUTES - 1000);
    });
    expect(save).not.toHaveBeenCalled();

    act(() => {
      Object.defineProperty(document, "visibilityState", {
        writable: true,
        value: "hidden",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    act(() => {
      Object.defineProperty(document, "visibilityState", {
        writable: true,
        value: "visible",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    act(() => {
      vi.advanceTimersByTime(TEN_MINUTES - 1000);
    });
    expect(save).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(save).toHaveBeenCalledTimes(1);
  });
});
