/**
 * Tests for authApi — the REST client for authentication endpoints.
 *
 * Uses vi.fn() to mock global fetch; no real network calls.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { authApi } from "./authApi.ts";

const BASE = "/api/auth";

function mockFetchSuccess(body: unknown, status = 200): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status,
      json: () => Promise.resolve(body),
    }),
  );
}

function mockFetchFailure(body: unknown, status = 400): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status,
      json: () => Promise.resolve(body),
    }),
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("authApi.signup", () => {
  it("sends POST /api/auth/signup with correct body", async () => {
    const responseBody = {
      id: "u1",
      email: "a@b.com",
      display_name: "Alice",
      access_token: "tok",
      token_type: "bearer",
    };
    mockFetchSuccess(responseBody, 201);

    const result = await authApi.signup({
      email: "a@b.com",
      password: "secret123",
      displayName: "Alice",
    });

    expect(fetch).toHaveBeenCalledWith(`${BASE}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "a@b.com",
        password: "secret123",
        display_name: "Alice",
      }),
    });
    expect(result).toEqual(responseBody);
  });

  it("throws on non-ok response", async () => {
    mockFetchFailure({ detail: "Email taken" }, 409);
    await expect(
      authApi.signup({ email: "a@b.com", password: "s", displayName: "A" }),
    ).rejects.toThrow("Email taken");
  });
});

describe("authApi.login", () => {
  it("sends POST /api/auth/login with correct body", async () => {
    const responseBody = {
      id: "u1",
      email: "a@b.com",
      display_name: "Alice",
      access_token: "tok",
      token_type: "bearer",
    };
    mockFetchSuccess(responseBody);

    const result = await authApi.login({
      email: "a@b.com",
      password: "secret123",
    });

    expect(fetch).toHaveBeenCalledWith(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "a@b.com", password: "secret123" }),
    });
    expect(result).toEqual(responseBody);
  });

  it("throws on invalid credentials", async () => {
    mockFetchFailure({ detail: "Invalid credentials" }, 401);
    await expect(
      authApi.login({ email: "a@b.com", password: "wrong" }),
    ).rejects.toThrow("Invalid credentials");
  });
});

describe("authApi.getMe", () => {
  it("sends GET /api/auth/me with Authorization header", async () => {
    const responseBody = { id: "u1", email: "a@b.com", display_name: "Alice" };
    mockFetchSuccess(responseBody);

    const result = await authApi.getMe("my-token");

    expect(fetch).toHaveBeenCalledWith(`${BASE}/me`, {
      headers: { Authorization: "Bearer my-token" },
    });
    expect(result).toEqual(responseBody);
  });

  it("throws on 401", async () => {
    mockFetchFailure({ detail: "Not authenticated" }, 401);
    await expect(authApi.getMe("bad-token")).rejects.toThrow(
      "Not authenticated",
    );
  });
});
