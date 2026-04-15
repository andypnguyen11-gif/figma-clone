import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { LockOverlay } from "./LockOverlay.tsx";
import { useLockStore } from "../../features/locking/lockStore.ts";
import { useElementStore } from "../../features/elements/elementStore.ts";
import type { CanvasElement } from "../../types/element.ts";

vi.mock("react-konva", () => ({
  Group: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="lock-group">{children}</div>
  ),
  Rect: (props: Record<string, unknown>) => (
    <div data-testid="lock-rect" data-stroke={props.stroke as string} />
  ),
  Text: (props: Record<string, unknown>) => (
    <div data-testid="lock-label">{props.text as string}</div>
  ),
}));

const makeElement = (overrides: Partial<CanvasElement> = {}): CanvasElement => ({
  id: "e1",
  canvasId: "c1",
  elementType: "rectangle",
  x: 10,
  y: 20,
  width: 100,
  height: 50,
  fill: "#FFFFFF",
  stroke: "#000000",
  strokeWidth: 1,
  opacity: 1,
  rotation: 0,
  zIndex: 0,
  textContent: null,
  fontSize: null,
  textColor: null,
  createdAt: "",
  updatedAt: "",
  ...overrides,
});

describe("LockOverlay", () => {
  beforeEach(() => {
    useLockStore.setState({ locks: new Map() });
    useElementStore.setState({ elements: new Map(), selectedElementId: null });
  });

  it("renders nothing when no locks are active", () => {
    const { container } = render(<LockOverlay currentUserId="me" />);
    expect(container.querySelectorAll('[data-testid="lock-group"]')).toHaveLength(0);
  });

  it("renders an overlay for elements locked by other users", () => {
    useElementStore.getState().addElement(makeElement({ id: "e1" }));
    useLockStore.getState().setLock("e1", {
      userId: "other-user",
      userName: "Alice",
      color: "#FF0000",
    });

    render(<LockOverlay currentUserId="me" />);
    expect(screen.getAllByTestId("lock-group").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Alice")).toBeDefined();
  });

  it("renders the lock owner's color on the overlay", () => {
    useElementStore.getState().addElement(makeElement({ id: "e1" }));
    useLockStore.getState().setLock("e1", {
      userId: "other-user",
      userName: "Alice",
      color: "#FF0000",
    });

    render(<LockOverlay currentUserId="me" />);
    const rect = screen.getByTestId("lock-rect");
    expect(rect.getAttribute("data-stroke")).toBe("#FF0000");
  });

  it("does not render overlay for elements locked by the current user", () => {
    useElementStore.getState().addElement(makeElement({ id: "e1" }));
    useLockStore.getState().setLock("e1", {
      userId: "me",
      userName: "Me",
      color: "#00FF00",
    });

    render(<LockOverlay currentUserId="me" />);
    expect(screen.queryAllByTestId("lock-group")).toHaveLength(0);
  });

  it("handles multiple locked elements from different users", () => {
    useElementStore.getState().addElement(makeElement({ id: "e1" }));
    useElementStore.getState().addElement(makeElement({ id: "e2", x: 200 }));
    useLockStore.getState().setLock("e1", {
      userId: "user-a",
      userName: "Alice",
      color: "#FF0000",
    });
    useLockStore.getState().setLock("e2", {
      userId: "user-b",
      userName: "Bob",
      color: "#0000FF",
    });

    render(<LockOverlay currentUserId="me" />);
    expect(screen.getAllByTestId("lock-group")).toHaveLength(2);
    expect(screen.getByText("Alice")).toBeDefined();
    expect(screen.getByText("Bob")).toBeDefined();
  });
});
