/**
 * App integration test — verifies the router boots and
 * unauthenticated users land on the login page.
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "./App.tsx";
import { useAuthStore } from "./features/auth/authStore.ts";

vi.mock("./services/api/authApi.ts", () => ({
  authApi: {
    getMe: vi.fn().mockRejectedValue(new Error("no token")),
  },
}));

vi.mock("./pages/CanvasPage.tsx", () => ({
  CanvasPage: () => <div data-testid="canvas-page" />,
}));

beforeEach(() => {
  useAuthStore.getState().logout();
  localStorage.clear();
});

describe("App", () => {
  it("renders the login page when unauthenticated", async () => {
    render(<App />);
    expect(
      await screen.findByRole("button", { name: /log in/i }),
    ).toBeInTheDocument();
  });
});
