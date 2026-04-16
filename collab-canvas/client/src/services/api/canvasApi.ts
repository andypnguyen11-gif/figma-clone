/**
 * REST client for canvas CRUD and sharing endpoints.
 *
 * All responses are the raw DTOs from the server (snake_case).
 * Callers are responsible for mapping to client types.
 */
import { authHeaders, jsonAuthHeaders, handleErrorResponse } from "./client.ts";

const BASE = "/api/canvas";

export interface CanvasResponseDTO {
  id: string;
  title: string;
  owner_id: string;
  share_token: string;
  created_at: string;
  updated_at: string;
}

/** GET /api/canvas — owned + joined canvases with owner labeling. */
export interface CanvasListItemDTO extends CanvasResponseDTO {
  owner_display_name: string;
  is_owner: boolean;
}

export interface ShareResponseDTO {
  canvas_id: string;
  share_token: string;
  share_url: string;
}

export const canvasApi = {
  /** GET /api/canvas — canvases you own and canvases you joined (newest first on server). */
  async listMine(token: string): Promise<CanvasListItemDTO[]> {
    const res = await fetch(BASE, {
      headers: authHeaders(token),
    });
    if (!res.ok) return handleErrorResponse(res);
    return res.json();
  },

  async create(title: string, token: string): Promise<CanvasResponseDTO> {
    const res = await fetch(BASE, {
      method: "POST",
      headers: jsonAuthHeaders(token),
      body: JSON.stringify({ title }),
    });
    if (!res.ok) return handleErrorResponse(res);
    return res.json();
  },

  async get(canvasId: string, token: string): Promise<CanvasResponseDTO> {
    const res = await fetch(`${BASE}/${canvasId}`, {
      headers: authHeaders(token),
    });
    if (!res.ok) return handleErrorResponse(res);
    return res.json();
  },

  async update(
    canvasId: string,
    data: { title?: string },
    token: string,
  ): Promise<CanvasResponseDTO> {
    const res = await fetch(`${BASE}/${canvasId}`, {
      method: "PATCH",
      headers: jsonAuthHeaders(token),
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleErrorResponse(res);
    return res.json();
  },

  async getShareInfo(canvasId: string, token: string): Promise<ShareResponseDTO> {
    const res = await fetch(`${BASE}/${canvasId}/share`, {
      headers: authHeaders(token),
    });
    if (!res.ok) return handleErrorResponse(res);
    return res.json();
  },

  async joinByToken(shareToken: string, token: string): Promise<CanvasResponseDTO> {
    const res = await fetch(`${BASE}/join/${encodeURIComponent(shareToken)}`, {
      headers: authHeaders(token),
    });
    if (!res.ok) return handleErrorResponse(res);
    return res.json();
  },
};
