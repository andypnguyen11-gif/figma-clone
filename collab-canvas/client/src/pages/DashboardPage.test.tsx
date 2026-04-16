/**
 * Tests for DashboardPage — lists owned canvases and create/join flows.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DashboardPage } from "./DashboardPage.tsx";
import { useAuthStore } from "../features/auth/authStore.ts";

vi.mock("../services/api/canvasApi.ts", () => ({
  canvasApi: {
    listMine: vi.fn(),
    create: vi.fn(),
    joinByToken: vi.fn(),
  },
}));

import { canvasApi } from "../services/api/canvasApi.ts";

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.getState().setAuth(
    { id: "u1", email: "a@b.com", displayName: "Alice" },
    "test-token",
  );
});

function renderPage() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

describe("DashboardPage", () => {
  it("loads and displays owned canvases with links to editor", async () => {
    vi.mocked(canvasApi.listMine).mockResolvedValue([
      {
        id: "canvas-1",
        title: "My Board",
        owner_id: "u1",
        share_token: "tok1",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-02T00:00:00Z",
      },
    ]);

    renderPage();

    await waitFor(() => {
      expect(canvasApi.listMine).toHaveBeenCalledWith("test-token");
    });

    expect(await screen.findByRole("link", { name: /my board/i })).toHaveAttribute(
      "href",
      "/canvas/canvas-1",
    );
  });

  it("shows empty state when user has no canvases", async () => {
    vi.mocked(canvasApi.listMine).mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/no canvases yet/i)).toBeInTheDocument();
    });
  });

  it("shows list error when fetch fails", async () => {
    vi.mocked(canvasApi.listMine).mockRejectedValue(new Error("Network down"));

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/network down/i);
    });
  });
});
