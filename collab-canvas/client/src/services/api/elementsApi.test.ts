/**
 * Tests for elementsApi — the REST client for element CRUD.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { elementsApi } from "./elementsApi.ts";

const TOKEN = "test-jwt";
const CANVAS_ID = "c1";
const BASE = `/api/canvas/${CANVAS_ID}/elements`;

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

function mockFetchNoContent(): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, status: 204 }),
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

const elementResponse = {
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

describe("elementsApi.list", () => {
  it("sends GET /api/canvas/:id/elements", async () => {
    mockFetchSuccess([elementResponse]);

    const result = await elementsApi.list(CANVAS_ID, TOKEN);

    expect(fetch).toHaveBeenCalledWith(BASE, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    expect(result).toEqual([elementResponse]);
  });
});

describe("elementsApi.create", () => {
  it("sends POST with element data", async () => {
    const payload = {
      element_type: "rectangle",
      x: 10,
      y: 20,
      width: 100,
      height: 50,
    };
    mockFetchSuccess(elementResponse, 201);

    const result = await elementsApi.create(CANVAS_ID, payload, TOKEN);

    expect(fetch).toHaveBeenCalledWith(BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify(payload),
    });
    expect(result).toEqual(elementResponse);
  });
});

describe("elementsApi.update", () => {
  it("sends PATCH with partial data", async () => {
    const payload = { x: 50, fill: "#FF0000" };
    mockFetchSuccess({ ...elementResponse, ...payload });

    const result = await elementsApi.update(
      CANVAS_ID,
      "e1",
      payload,
      TOKEN,
    );

    expect(fetch).toHaveBeenCalledWith(`${BASE}/e1`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify(payload),
    });
    expect(result.x).toBe(50);
  });
});

describe("elementsApi.remove", () => {
  it("sends DELETE /api/canvas/:id/elements/:eid", async () => {
    mockFetchNoContent();

    await elementsApi.remove(CANVAS_ID, "e1", TOKEN);

    expect(fetch).toHaveBeenCalledWith(`${BASE}/e1`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
  });

  it("throws on 404", async () => {
    mockFetchFailure({ detail: "Element not found" }, 404);
    await expect(
      elementsApi.remove(CANVAS_ID, "bad", TOKEN),
    ).rejects.toThrow("Element not found");
  });
});
