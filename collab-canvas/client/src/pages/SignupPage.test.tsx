/**
 * Tests for SignupPage — renders signup form, calls authApi on submit,
 * sets auth store on success, and navigates to canvas.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { SignupPage } from "./SignupPage.tsx";
import { useAuthStore } from "../features/auth/authStore.ts";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../services/api/authApi.ts", () => ({
  authApi: {
    signup: vi.fn(),
  },
}));

import { authApi } from "../services/api/authApi.ts";

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.getState().logout();
});

function renderPage() {
  return render(
    <MemoryRouter>
      <SignupPage />
    </MemoryRouter>,
  );
}

describe("SignupPage", () => {
  it("renders name, email, password fields and a submit button", () => {
    renderPage();
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign up/i }),
    ).toBeInTheDocument();
  });

  it("renders a link to the login page", () => {
    renderPage();
    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("calls authApi.signup and navigates on success", async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.signup).mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      display_name: "Alice",
      access_token: "tok123",
      token_type: "bearer",
    });

    renderPage();

    await user.type(screen.getByLabelText(/display name/i), "Alice");
    await user.type(screen.getByLabelText(/email/i), "a@b.com");
    await user.type(screen.getByLabelText(/password/i), "secret123");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(authApi.signup).toHaveBeenCalledWith({
        email: "a@b.com",
        password: "secret123",
        displayName: "Alice",
      });
    });

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows error message on signup failure", async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.signup).mockRejectedValue(new Error("Email already registered"));

    renderPage();

    await user.type(screen.getByLabelText(/display name/i), "Alice");
    await user.type(screen.getByLabelText(/email/i), "a@b.com");
    await user.type(screen.getByLabelText(/password/i), "secret123");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        /email already registered/i,
      );
    });
  });
});
