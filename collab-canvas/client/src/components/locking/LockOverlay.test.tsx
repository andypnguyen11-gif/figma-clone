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
  Circle: (props: Record<string, unknown>) => (
    <div
      data-testid="lock-circle"
      data-radius={String(props.radius)}
      data-stroke={props.stroke as string}
    />
  ),
  RegularPolygon: (props: Record<string, unknown>) => (
    <div
      data-testid="lock-triangle"
      data-sides={String(props.sides)}
      data-radius={String(props.radius)}
      data-stroke={props.stroke as string}
    />
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
    useElementStore.setState({
      elements: new Map(),
      selectedElementId: null,
      editingTextElementId: null,
    });
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

  it("uses a circle outline for circle elements (same geometry as CircleShape)", () => {
    useElementStore.getState().addElement(
      makeElement({
        id: "c1",
        elementType: "circle",
        width: 80,
        height: 80,
      }),
    );
    useLockStore.getState().setLock("c1", {
      userId: "other-user",
      userName: "Millie",
      color: "#00CED1",
    });

    render(<LockOverlay currentUserId="me" />);
    const circle = screen.getByTestId("lock-circle");
    expect(circle.getAttribute("data-radius")).toBe("40");
    expect(screen.queryByTestId("lock-rect")).toBeNull();
    expect(circle.getAttribute("data-stroke")).toBe("#00CED1");
  });

  it("uses a triangle outline for triangle elements (same geometry as TriangleShape)", () => {
    useElementStore.getState().addElement(
      makeElement({
        id: "t1",
        elementType: "triangle",
        width: 120,
        height: 120,
      }),
    );
    useLockStore.getState().setLock("t1", {
      userId: "other-user",
      userName: "Millie",
      color: "#10B981",
    });

    render(<LockOverlay currentUserId="me" />);
    const tri = screen.getByTestId("lock-triangle");
    expect(tri.getAttribute("data-sides")).toBe("3");
    expect(tri.getAttribute("data-radius")).toBe("60");
    expect(screen.queryByTestId("lock-rect")).toBeNull();
    expect(tri.getAttribute("data-stroke")).toBe("#10B981");
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
