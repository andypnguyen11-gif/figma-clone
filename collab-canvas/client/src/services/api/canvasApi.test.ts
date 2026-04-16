/**
 * Tests for canvasApi — the REST client for canvas CRUD and sharing.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { canvasApi } from "./canvasApi.ts";

const TOKEN = "test-jwt";

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

const canvasResponse = {
  id: "c1",
  title: "My Canvas",
  owner_id: "u1",
  share_token: "abc",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("canvasApi.listMine", () => {
  it("sends GET /api/canvas with auth", async () => {
    mockFetchSuccess([canvasResponse]);

    const result = await canvasApi.listMine(TOKEN);

    expect(fetch).toHaveBeenCalledWith("/api/canvas", {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    expect(result).toEqual([canvasResponse]);
  });

  it("returns empty array from JSON", async () => {
    mockFetchSuccess([]);

    const result = await canvasApi.listMine(TOKEN);

    expect(result).toEqual([]);
  });
});

describe("canvasApi.create", () => {
  it("sends POST /api/canvas with title", async () => {
    mockFetchSuccess(canvasResponse, 201);

    const result = await canvasApi.create("My Canvas", TOKEN);

    expect(fetch).toHaveBeenCalledWith("/api/canvas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({ title: "My Canvas" }),
    });
    expect(result).toEqual(canvasResponse);
  });
});

describe("canvasApi.get", () => {
  it("sends GET /api/canvas/:id", async () => {
    mockFetchSuccess(canvasResponse);

    const result = await canvasApi.get("c1", TOKEN);

    expect(fetch).toHaveBeenCalledWith("/api/canvas/c1", {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    expect(result).toEqual(canvasResponse);
  });

  it("throws on 404", async () => {
    mockFetchFailure({ detail: "Canvas not found" }, 404);
    await expect(canvasApi.get("bad", TOKEN)).rejects.toThrow(
      "Canvas not found",
    );
  });
});

describe("canvasApi.update", () => {
  it("sends PATCH /api/canvas/:id", async () => {
    mockFetchSuccess({ ...canvasResponse, title: "Renamed" });

    const result = await canvasApi.update("c1", { title: "Renamed" }, TOKEN);

    expect(fetch).toHaveBeenCalledWith("/api/canvas/c1", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({ title: "Renamed" }),
    });
    expect(result.title).toBe("Renamed");
  });
});

describe("canvasApi.getShareInfo", () => {
  it("sends GET /api/canvas/:id/share", async () => {
    const shareResp = {
      canvas_id: "c1",
      share_token: "abc",
      share_url: "http://localhost/canvas/join/abc",
    };
    mockFetchSuccess(shareResp);

    const result = await canvasApi.getShareInfo("c1", TOKEN);

    expect(fetch).toHaveBeenCalledWith("/api/canvas/c1/share", {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    expect(result).toEqual(shareResp);
  });
});

describe("canvasApi.joinByToken", () => {
  it("sends GET /api/canvas/join/:token", async () => {
    mockFetchSuccess(canvasResponse);

    const result = await canvasApi.joinByToken("abc", TOKEN);

    expect(fetch).toHaveBeenCalledWith("/api/canvas/join/abc", {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    expect(result).toEqual(canvasResponse);
  });
});
