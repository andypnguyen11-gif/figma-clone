/**
 * Tests for debounced save when the element list (not selection) changes.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebouncedSaveOnElementChange } from "./useDebouncedSaveOnElementChange.ts";
import { useElementStore } from "../features/elements/elementStore.ts";
import type { CanvasElement } from "../types/element.ts";

const makeEl = (id: string): CanvasElement => ({
  id,
  canvasId: "c1",
  elementType: "rectangle",
  x: 0,
  y: 0,
  width: 10,
  height: 10,
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

describe("useDebouncedSaveOnElementChange", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useElementStore.setState({
      elements: new Map(),
      selectedElementId: null,
      editingTextElementId: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls save after delay when elements change", () => {
    const save = vi.fn();
    renderHook(() =>
      useDebouncedSaveOnElementChange(save, { enabled: true, delayMs: 400 }),
    );

    act(() => {
      useElementStore.getState().addElement(makeEl("e1"));
    });
    expect(save).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("does not fire when only selectedElementId changes", () => {
    const save = vi.fn();
    act(() => {
      useElementStore.getState().addElement(makeEl("e1"));
    });

    renderHook(() =>
      useDebouncedSaveOnElementChange(save, { enabled: true, delayMs: 200 }),
    );

    act(() => {
      useElementStore.getState().setSelectedElementId("e1");
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(save).not.toHaveBeenCalled();
  });

  it("does nothing when disabled", () => {
    const save = vi.fn();
    renderHook(() =>
      useDebouncedSaveOnElementChange(save, { enabled: false, delayMs: 200 }),
    );

    act(() => {
      useElementStore.getState().addElement(makeEl("e1"));
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(save).not.toHaveBeenCalled();
  });

  it("resets debounce when elements change again before delay elapses", () => {
    const save = vi.fn();
    renderHook(() =>
      useDebouncedSaveOnElementChange(save, { enabled: true, delayMs: 500 }),
    );

    act(() => {
      useElementStore.getState().addElement(makeEl("e1"));
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    act(() => {
      useElementStore.getState().updateElement("e1", { x: 99 });
    });
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(save).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(save).toHaveBeenCalledTimes(1);
  });
});
