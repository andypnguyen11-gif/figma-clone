import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { PropertyPanel } from "./PropertyPanel.tsx";
import { useElementStore } from "../../features/elements/elementStore.ts";
import type { CanvasElement } from "../../types/element.ts";

const makeElement = (overrides: Partial<CanvasElement> = {}): CanvasElement => ({
  id: "el-1",
  canvasId: "c1",
  elementType: "rectangle",
  x: 10,
  y: 20,
  width: 100,
  height: 80,
  fill: "#3B82F6",
  stroke: "#1E40AF",
  strokeWidth: 2,
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

function seedStore(element: CanvasElement, selected = true): void {
  const elements = new Map<string, CanvasElement>();
  elements.set(element.id, element);
  useElementStore.setState({
    elements,
    selectedElementId: selected ? element.id : null,
    editingTextElementId: null,
  });
}

describe("PropertyPanel", () => {
  beforeEach(() => {
    useElementStore.setState({
      elements: new Map(),
      selectedElementId: null,
      editingTextElementId: null,
    });
  });

  // --- Visibility ---

  it("renders nothing when no element is selected", () => {
    const { container } = render(<PropertyPanel />);
    expect(container.querySelector("[data-testid='property-panel']")).toBeNull();
  });

  it("renders the panel when an element is selected", () => {
    seedStore(makeElement());
    render(<PropertyPanel />);
    expect(screen.getByTestId("property-panel")).toBeDefined();
  });

  // --- Fill color ---

  it("displays the current fill color", () => {
    seedStore(makeElement({ fill: "#FF0000" }));
    render(<PropertyPanel />);
    const input = screen.getByLabelText(/fill/i) as HTMLInputElement;
    expect(input.value).toBe("#ff0000");
  });

  it("updates fill color on change", () => {
    seedStore(makeElement());
    render(<PropertyPanel />);
    const input = screen.getByLabelText(/fill/i);
    fireEvent.input(input, { target: { value: "#00FF00" } });
    const updated = useElementStore.getState().elements.get("el-1");
    expect(updated?.fill).toBe("#00FF00");
  });

  // --- Stroke color ---

  it("displays the current stroke color", () => {
    seedStore(makeElement({ stroke: "#AABBCC" }));
    render(<PropertyPanel />);
    const input = screen.getByLabelText(/stroke color/i) as HTMLInputElement;
    expect(input.value).toBe("#aabbcc");
  });

  it("updates stroke color on change", () => {
    seedStore(makeElement());
    render(<PropertyPanel />);
    const input = screen.getByLabelText(/stroke color/i);
    fireEvent.input(input, { target: { value: "#112233" } });
    const updated = useElementStore.getState().elements.get("el-1");
    expect(updated?.stroke).toBe("#112233");
  });

  // --- Stroke width ---

  it("displays the current stroke width", () => {
    seedStore(makeElement({ strokeWidth: 5 }));
    render(<PropertyPanel />);
    const input = screen.getByLabelText(/stroke width/i) as HTMLInputElement;
    expect(input.value).toBe("5");
  });

  it("updates stroke width on change", () => {
    seedStore(makeElement());
    render(<PropertyPanel />);
    const input = screen.getByLabelText(/stroke width/i);
    fireEvent.change(input, { target: { value: "8" } });
    const updated = useElementStore.getState().elements.get("el-1");
    expect(updated?.strokeWidth).toBe(8);
  });

  // --- Opacity ---

  it("displays the current opacity", () => {
    seedStore(makeElement({ opacity: 0.5 }));
    render(<PropertyPanel />);
    const input = screen.getByLabelText(/opacity/i) as HTMLInputElement;
    expect(input.value).toBe("0.5");
  });

  it("updates opacity on change", () => {
    seedStore(makeElement());
    render(<PropertyPanel />);
    const input = screen.getByLabelText(/opacity/i);
    fireEvent.change(input, { target: { value: "0.3" } });
    const updated = useElementStore.getState().elements.get("el-1");
    expect(updated?.opacity).toBe(0.3);
  });

  // --- Rotation ---

  it("displays the current rotation", () => {
    seedStore(makeElement({ rotation: 45 }));
    render(<PropertyPanel />);
    const input = screen.getByLabelText(/rotation/i) as HTMLInputElement;
    expect(input.value).toBe("45");
  });

  it("updates rotation on change", () => {
    seedStore(makeElement());
    render(<PropertyPanel />);
    const input = screen.getByLabelText(/rotation/i);
    fireEvent.change(input, { target: { value: "90" } });
    const updated = useElementStore.getState().elements.get("el-1");
    expect(updated?.rotation).toBe(90);
  });

  // --- Z-index ---

  it("moves element forward on bring-forward click", () => {
    seedStore(makeElement({ zIndex: 2 }));
    render(<PropertyPanel />);
    fireEvent.click(screen.getByRole("button", { name: /bring forward/i }));
    const updated = useElementStore.getState().elements.get("el-1");
    expect(updated?.zIndex).toBe(3);
  });

  it("moves element backward on send-backward click", () => {
    seedStore(makeElement({ zIndex: 2 }));
    render(<PropertyPanel />);
    fireEvent.click(screen.getByRole("button", { name: /send backward/i }));
    const updated = useElementStore.getState().elements.get("el-1");
    expect(updated?.zIndex).toBe(1);
  });

  it("does not go below zIndex 0", () => {
    seedStore(makeElement({ zIndex: 0 }));
    render(<PropertyPanel />);
    fireEvent.click(screen.getByRole("button", { name: /send backward/i }));
    const updated = useElementStore.getState().elements.get("el-1");
    expect(updated?.zIndex).toBe(0);
  });

  // --- Text-specific fields ---

  it("hides text fields for non-text elements", () => {
    seedStore(makeElement({ elementType: "rectangle" }));
    render(<PropertyPanel />);
    expect(screen.queryByLabelText(/font size/i)).toBeNull();
    expect(screen.queryByLabelText(/text color/i)).toBeNull();
  });

  it("shows font size for text elements", () => {
    seedStore(makeElement({ elementType: "text", fontSize: 24, textColor: "#FFFFFF" }));
    render(<PropertyPanel />);
    const input = screen.getByLabelText(/font size/i) as HTMLInputElement;
    expect(input.value).toBe("24");
  });

  it("updates font size on change", () => {
    seedStore(makeElement({ elementType: "text", fontSize: 24, textColor: "#FFFFFF" }));
    render(<PropertyPanel />);
    const input = screen.getByLabelText(/font size/i);
    fireEvent.change(input, { target: { value: "32" } });
    const updated = useElementStore.getState().elements.get("el-1");
    expect(updated?.fontSize).toBe(32);
  });

  it("shows text color for text elements", () => {
    seedStore(makeElement({ elementType: "text", fontSize: 24, textColor: "#FF0000" }));
    render(<PropertyPanel />);
    const input = screen.getByLabelText(/text color/i) as HTMLInputElement;
    expect(input.value).toBe("#ff0000");
  });

  it("updates text color on change", () => {
    seedStore(makeElement({ elementType: "text", fontSize: 24, textColor: "#FFFFFF" }));
    render(<PropertyPanel />);
    const input = screen.getByLabelText(/text color/i);
    fireEvent.input(input, { target: { value: "#00FF00" } });
    const updated = useElementStore.getState().elements.get("el-1");
    expect(updated?.textColor).toBe("#00FF00");
  });

  // --- Element type label ---

  it("displays the element type", () => {
    seedStore(makeElement({ elementType: "circle" }));
    render(<PropertyPanel />);
    expect(screen.getByText(/circle/i)).toBeDefined();
  });
});
