import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "./App";

vi.mock("react-konva", () => ({
  Stage: ({ children, ...props }: Record<string, unknown>) => (
    <div data-testid="konva-stage" {...props}>
      {children as React.ReactNode}
    </div>
  ),
  Layer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="konva-layer">{children}</div>
  ),
  Rect: () => <div data-testid="konva-rect" />,
  Circle: () => <div data-testid="konva-circle" />,
  Line: () => <div data-testid="konva-line" />,
  RegularPolygon: () => <div data-testid="konva-polygon" />,
  Text: () => <div data-testid="konva-text" />,
  Transformer: () => <div data-testid="konva-transformer" />,
  Group: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="konva-group">{children}</div>
  ),
}));

describe("App", () => {
  it("renders the canvas stage with demo elements", () => {
    const { getByTestId, getAllByTestId } = render(<App />);
    expect(getByTestId("konva-stage")).toBeDefined();
    expect(getByTestId("konva-layer")).toBeDefined();
    const shapes = [
      ...getAllByTestId("konva-rect"),
      ...getAllByTestId("konva-circle"),
      ...getAllByTestId("konva-polygon"),
      ...getAllByTestId("konva-text"),
    ];
    expect(shapes.length).toBeGreaterThanOrEqual(4);
  });

  it("renders the toolbar", () => {
    const { getByRole } = render(<App />);
    expect(getByRole("toolbar")).toBeDefined();
  });
});
