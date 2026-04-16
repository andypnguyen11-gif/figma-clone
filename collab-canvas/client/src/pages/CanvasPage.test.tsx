/**
 * Tests for CanvasPage — loads canvas + elements from API on mount,
 * populates stores, and renders the editor shell.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CanvasPage } from "./CanvasPage.tsx";
import { useCanvasStore } from "../features/canvas/canvasStore.ts";
import { useElementStore } from "../features/elements/elementStore.ts";
import { useAuthStore } from "../features/auth/authStore.ts";

vi.mock("../services/api/canvasApi.ts", () => ({
  canvasApi: { get: vi.fn(), getShareInfo: vi.fn() },
}));
vi.mock("../services/api/elementsApi.ts", () => ({
  elementsApi: { list: vi.fn(), update: vi.fn(), create: vi.fn() },
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

const mockUseCanvasWebSocket = vi.hoisted(() =>
  vi.fn(() => ({
    status: "offline" as const,
    lastError: null,
    hasCollaborators: false,
    sendJson: vi.fn(),
  })),
);

vi.mock("../hooks/useCanvasWebSocket.ts", () => ({
  useCanvasWebSocket: () => mockUseCanvasWebSocket(),
}));

import { canvasApi } from "../services/api/canvasApi.ts";
import { elementsApi } from "../services/api/elementsApi.ts";

const CANVAS_ID = "c1";

beforeEach(() => {
  vi.clearAllMocks();
  mockUseCanvasWebSocket.mockImplementation(() => ({
    status: "offline",
    lastError: null,
    hasCollaborators: false,
    sendJson: vi.fn(),
  }));
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

  it("renders home, share link, and log out in the top bar", async () => {
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
      expect(
        screen.getByRole("button", { name: /share link/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument();
    });
  });

  it("fetches share info and copies share URL when Share link is clicked", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    vi.mocked(canvasApi.get).mockResolvedValue({
      id: CANVAS_ID,
      title: "Test",
      owner_id: "u1",
      share_token: "abc",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    });
    vi.mocked(elementsApi.list).mockResolvedValue([]);
    vi.mocked(canvasApi.getShareInfo).mockResolvedValue({
      canvas_id: CANVAS_ID,
      share_token: "tok-xyz",
      share_url: "http://localhost/canvas/join/tok-xyz",
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /share link/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /share link/i }));

    await waitFor(() => {
      expect(canvasApi.getShareInfo).toHaveBeenCalledWith(CANVAS_ID, "test-token");
      expect(writeText).toHaveBeenCalledWith("http://localhost/canvas/join/tok-xyz");
    });

    await waitFor(() => {
      expect(screen.getByText(/share link copied/i)).toBeInTheDocument();
    });
  });

  it("shows an error when Share link fails", async () => {
    vi.mocked(canvasApi.get).mockResolvedValue({
      id: CANVAS_ID,
      title: "Test",
      owner_id: "u1",
      share_token: "abc",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    });
    vi.mocked(elementsApi.list).mockResolvedValue([]);
    vi.mocked(canvasApi.getShareInfo).mockRejectedValue(new Error("Forbidden"));

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /share link/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /share link/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/forbidden/i);
    });
  });

  it("persists all elements via debounced save after an element edit", async () => {
    const elementRow = {
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
    };

    vi.mocked(canvasApi.get).mockResolvedValue({
      id: CANVAS_ID,
      title: "Test",
      owner_id: "u1",
      share_token: "abc",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    });
    vi.mocked(elementsApi.list).mockResolvedValue([elementRow]);
    vi.mocked(elementsApi.update).mockResolvedValue(elementRow);

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("canvas-viewport")).toBeInTheDocument();
    });

    act(() => {
      useElementStore.getState().updateElement("e1", { x: 10, y: 20 });
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 800));
    });

    await waitFor(() => {
      expect(elementsApi.update).toHaveBeenCalledWith(
        CANVAS_ID,
        "e1",
        expect.objectContaining({
          x: 10,
          y: 20,
          width: 100,
          height: 50,
          fill: "#FFF",
          stroke_width: 1,
          z_index: 0,
        }),
        "test-token",
      );
    });
    expect(elementsApi.create).not.toHaveBeenCalled();
  });

  it("POSTs new local-only elements after debounced save then tracks server ids", async () => {
    vi.mocked(canvasApi.get).mockResolvedValue({
      id: CANVAS_ID,
      title: "Test",
      owner_id: "u1",
      share_token: "abc",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    });
    vi.mocked(elementsApi.list).mockResolvedValue([]);

    const serverDto = {
      id: "server-e1",
      canvas_id: CANVAS_ID,
      element_type: "rectangle",
      x: 12,
      y: 34,
      width: 80,
      height: 40,
      fill: "#3B82F6",
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
    };
    vi.mocked(elementsApi.create).mockResolvedValue(serverDto);

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("canvas-viewport")).toBeInTheDocument();
    });

    useElementStore.getState().addElement({
      id: "client-local-uuid",
      canvasId: CANVAS_ID,
      elementType: "rectangle",
      x: 12,
      y: 34,
      width: 80,
      height: 40,
      fill: "#3B82F6",
      stroke: "#000",
      strokeWidth: 1,
      opacity: 1,
      rotation: 0,
      zIndex: 0,
      textContent: null,
      fontSize: null,
      textColor: null,
      createdAt: "",
      updatedAt: "",
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 800));
    });

    await waitFor(() => {
      expect(elementsApi.create).toHaveBeenCalledWith(
        CANVAS_ID,
        expect.objectContaining({
          element_type: "rectangle",
          x: 12,
          y: 34,
          width: 80,
          height: 40,
        }),
        "test-token",
      );
    });

    expect(elementsApi.update).not.toHaveBeenCalled();
    expect(useElementStore.getState().getElement("client-local-uuid")).toBeUndefined();
    expect(useElementStore.getState().getElement("server-e1")).toBeDefined();
  });

  it("shows Collaboration connected when another user is in the room", async () => {
    mockUseCanvasWebSocket.mockImplementation(() => ({
      status: "live",
      lastError: null,
      hasCollaborators: true,
      sendJson: vi.fn(),
    }));
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
      expect(screen.getByText("Collaboration connected")).toBeInTheDocument();
    });
  });

  it("hides Collaboration connected when live but no other peers", async () => {
    mockUseCanvasWebSocket.mockImplementation(() => ({
      status: "live",
      lastError: null,
      hasCollaborators: false,
      sendJson: vi.fn(),
    }));
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
      expect(screen.getByRole("button", { name: /share link/i })).toBeInTheDocument();
    });
    expect(screen.queryByText("Collaboration connected")).not.toBeInTheDocument();
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
