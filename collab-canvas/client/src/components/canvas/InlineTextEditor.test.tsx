import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InlineTextEditor } from "./InlineTextEditor.tsx";

describe("InlineTextEditor", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces onDraftChange while typing", () => {
    const onDraftChange = vi.fn();
    const onComplete = vi.fn();

    render(
      <InlineTextEditor
        elementId="el-1"
        initialText=""
        x={0}
        y={0}
        width={100}
        height={24}
        fontSize={16}
        color="#fff"
        scale={1}
        stagePosition={{ x: 0, y: 0 }}
        draftDebounceMs={300}
        onDraftChange={onDraftChange}
        onComplete={onComplete}
      />,
    );

    const ta = screen.getByRole("textbox") as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: "a" } });
    fireEvent.change(ta, { target: { value: "ab" } });

    expect(onDraftChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(299);
    expect(onDraftChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onDraftChange).toHaveBeenCalledTimes(1);
    expect(onDraftChange).toHaveBeenCalledWith("el-1", "ab");
  });

  it("flushes draft and completes on blur without waiting for debounce", () => {
    const onDraftChange = vi.fn();
    const onComplete = vi.fn();

    render(
      <InlineTextEditor
        elementId="el-1"
        initialText=""
        x={0}
        y={0}
        width={100}
        height={24}
        fontSize={16}
        color="#fff"
        scale={1}
        stagePosition={{ x: 0, y: 0 }}
        draftDebounceMs={300}
        onDraftChange={onDraftChange}
        onComplete={onComplete}
      />,
    );

    const ta = screen.getByRole("textbox") as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: "hello" } });
    fireEvent.blur(ta);

    expect(onDraftChange).toHaveBeenCalledWith("el-1", "hello");
    expect(onComplete).toHaveBeenCalledWith("el-1", "hello");
  });
});
