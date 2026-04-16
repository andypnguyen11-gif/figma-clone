/**
 * Tests for PresenceLayer — remote cursor markers in canvas space.
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { PresenceLayer } from "./PresenceLayer.tsx";
import { usePresenceStore } from "../../features/presence/presenceStore.ts";

vi.mock("react-konva", () => ({
  Group: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="presence-group">{children}</div>
  ),
  Circle: (props: Record<string, unknown>) => (
    <div
      data-testid="presence-dot"
      data-fill={props.fill as string}
      data-x={props.x as number}
      data-y={props.y as number}
    />
  ),
  Text: (props: Record<string, unknown>) => (
    <div data-testid="presence-label">{props.text as string}</div>
  ),
}));

describe("PresenceLayer", () => {
  beforeEach(() => {
    usePresenceStore.getState().clearCursors();
  });

  it("renders nothing when there are no remote cursors", () => {
    const { container } = render(<PresenceLayer currentUserId="me" />);
    expect(container.querySelectorAll('[data-testid="presence-group"]')).toHaveLength(0);
  });

  it("renders a marker per remote cursor", () => {
    usePresenceStore.getState().setCursor({
      userId: "u2",
      userName: "Bob",
      color: "#00FF00",
      x: 50,
      y: 60,
    });

    render(<PresenceLayer currentUserId="me" />);

    expect(screen.getByText("Bob")).toBeInTheDocument();
    const dots = screen.getAllByTestId("presence-dot");
    expect(dots.length).toBeGreaterThanOrEqual(1);
    expect(dots[0].getAttribute("data-fill")).toBe("#00FF00");
  });
});
