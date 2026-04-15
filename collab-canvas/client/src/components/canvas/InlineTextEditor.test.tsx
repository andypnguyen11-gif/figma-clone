import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { InlineTextEditor } from "./InlineTextEditor.tsx";

describe("InlineTextEditor", () => {
  const defaultProps = {
    elementId: "e1",
    initialText: "Hello",
    x: 100,
    y: 200,
    width: 200,
    height: 40,
    fontSize: 16,
    color: "#FFFFFF",
    scale: 1,
    stagePosition: { x: 0, y: 0 },
    onComplete: vi.fn(),
  };

  beforeEach(() => {
    defaultProps.onComplete = vi.fn();
  });

  it("renders a textarea with the initial text", () => {
    render(<InlineTextEditor {...defaultProps} />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeDefined();
    expect((textarea as HTMLTextAreaElement).value).toBe("Hello");
  });

  it("auto-focuses the textarea on mount", () => {
    render(<InlineTextEditor {...defaultProps} />);
    const textarea = screen.getByRole("textbox");
    expect(document.activeElement).toBe(textarea);
  });

  it("calls onComplete with updated text on blur", () => {
    render(<InlineTextEditor {...defaultProps} />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Updated" } });
    fireEvent.blur(textarea);
    expect(defaultProps.onComplete).toHaveBeenCalledWith("e1", "Updated");
  });

  it("calls onComplete on Escape key", () => {
    render(<InlineTextEditor {...defaultProps} />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Changed" } });
    fireEvent.keyDown(textarea, { key: "Escape" });
    expect(defaultProps.onComplete).toHaveBeenCalledWith("e1", "Changed");
  });

  it("positions the textarea using element coordinates and scale", () => {
    render(
      <InlineTextEditor
        {...defaultProps}
        x={50}
        y={100}
        scale={2}
        stagePosition={{ x: 10, y: 20 }}
      />,
    );
    const textarea = screen.getByRole("textbox");
    expect(textarea.style.position).toBe("absolute");
  });
});
