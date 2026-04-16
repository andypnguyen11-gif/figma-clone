/**
 * Tests for CanvasPage — loads canvas + elements from API on mount,
 * populates stores, and renders the editor shell.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CanvasPage } from "./CanvasPage.tsx";
import { useCanvasStore } from "../features/canvas/canvasStore.ts";
import { useElementStore } from "../features/elements/elementStore.ts";
import { useAuthStore } from "../features/auth/authStore.ts";

vi.mock("../services/api/canvasApi.ts", () => ({
  canvasApi: { get: vi.fn() },
}));
vi.mock("../services/api/elementsApi.ts", () => ({
  elementsApi: { list: vi.fn() },
}));

vi.mock("../components/canvas/CanvasViewport.tsx", () => ({
  default: () => <div data-testid="canvas-viewport" />,
}));
vi.mock("../components/toolbar/Toolbar.tsx", () => ({
  Toolbar: () => <div data-testid="toolbar" />,
}));
vi.mock("../components/properties/PropertyPanel.tsx", () => ({
  PropertyPanel: () => <div data-testid="property-panel" />,
}));

import { canvasApi } from "../services/api/canvasApi.ts";
import { elementsApi } from "../services/api/elementsApi.ts";

const CANVAS_ID = "c1";

beforeEach(() => {
  vi.clearAllMocks();
  useCanvasStore.getState().clearCanvas();
  useElementStore.getState().setElements([]);
  useAuthStore.getState().setAuth(
    { id: "u1", email: "a@b.com", displayName: "Alice" },
    "test-token",
  );
});

function renderPage(canvasId = CANVAS_ID) {
  return render(
    <MemoryRouter initialEntries={[`/canvas/${canvasId}`]}>
      <Routes>
        <Route path="/canvas/:canvasId" element={<CanvasPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CanvasPage", () => {
  it("fetches canvas and elements on mount, populates stores", async () => {
    const canvasData = {
      id: CANVAS_ID,
      title: "Test Canvas",
      owner_id: "u1",
      share_token: "abc",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    const elementsData = [
      {
        id: "e1",
        canvas_id: CANVAS_ID,
        element_type: "rectangle",
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        fill: "#FFF",
        stroke: "#000",
        stroke_width: 1,
        opacity: 1,
        rotation: 0,
        z_index: 0,
        text_content: null,
        font_size: null,
        text_color: null,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ];

    vi.mocked(canvasApi.get).mockResolvedValue(canvasData);
    vi.mocked(elementsApi.list).mockResolvedValue(elementsData);

    renderPage();

    await waitFor(() => {
      expect(canvasApi.get).toHaveBeenCalledWith(CANVAS_ID, "test-token");
      expect(elementsApi.list).toHaveBeenCalledWith(CANVAS_ID, "test-token");
    });

    await waitFor(() => {
      expect(useCanvasStore.getState().canvas).toBeTruthy();
      expect(useCanvasStore.getState().canvas?.id).toBe(CANVAS_ID);
    });

    await waitFor(() => {
      const elements = useElementStore.getState().getAllElements();
      expect(elements).toHaveLength(1);
      expect(elements[0].id).toBe("e1");
    });
  });

  it("renders the canvas viewport, toolbar, and property panel", async () => {
    vi.mocked(canvasApi.get).mockResolvedValue({
      id: CANVAS_ID,
      title: "Test",
      owner_id: "u1",
      share_token: "abc",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    });
    vi.mocked(elementsApi.list).mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("canvas-viewport")).toBeInTheDocument();
      expect(screen.getByTestId("toolbar")).toBeInTheDocument();
      expect(screen.getByTestId("property-panel")).toBeInTheDocument();
    });
  });

  it("renders home and log out in the top bar", async () => {
    vi.mocked(canvasApi.get).mockResolvedValue({
      id: CANVAS_ID,
      title: "Test",
      owner_id: "u1",
      share_token: "abc",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    });
    vi.mocked(elementsApi.list).mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^home$/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument();
    });
  });

  it("clears auth when Log out is clicked", async () => {
    vi.mocked(canvasApi.get).mockResolvedValue({
      id: CANVAS_ID,
      title: "Test",
      owner_id: "u1",
      share_token: "abc",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    });
    vi.mocked(elementsApi.list).mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /log out/i }));

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().token).toBeNull();
  });

  it("shows loading state while fetching", () => {
    vi.mocked(canvasApi.get).mockReturnValue(new Promise(() => {}));
    vi.mocked(elementsApi.list).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("shows error state when fetch fails", async () => {
    vi.mocked(canvasApi.get).mockRejectedValue(new Error("Network error"));
    vi.mocked(elementsApi.list).mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });
});
