import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "./authStore.ts";

describe("authStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
    localStorage.clear();
  });

  it("starts unauthenticated", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("sets auth user and token", () => {
    const user = { id: "u1", email: "a@b.com", displayName: "Alice" };
    useAuthStore.getState().setAuth(user, "jwt-token");

    const state = useAuthStore.getState();
    expect(state.user).toEqual(user);
    expect(state.token).toBe("jwt-token");
    expect(state.isAuthenticated).toBe(true);
    expect(localStorage.getItem("token")).toBe("jwt-token");
  });

  it("clears auth on logout", () => {
    const user = { id: "u1", email: "a@b.com", displayName: "Alice" };
    useAuthStore.getState().setAuth(user, "jwt-token");
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(localStorage.getItem("token")).toBeNull();
  });
});
