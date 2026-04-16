/**
 * REST client for element CRUD endpoints.
 *
 * Elements live under /api/canvas/:canvasId/elements.
 */
import { authHeaders, jsonAuthHeaders, handleErrorResponse } from "./client.ts";

export interface ElementResponseDTO {
  id: string;
  canvas_id: string;
  element_type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  stroke_width: number;
  opacity: number;
  rotation: number;
  z_index: number;
  text_content: string | null;
  font_size: number | null;
  text_color: string | null;
  created_at: string;
  updated_at: string;
}

function base(canvasId: string): string {
  return `/api/canvas/${canvasId}/elements`;
}

export const elementsApi = {
  async list(canvasId: string, token: string): Promise<ElementResponseDTO[]> {
    const res = await fetch(base(canvasId), {
      headers: authHeaders(token),
    });
    if (!res.ok) return handleErrorResponse(res);
    return res.json();
  },

  async create(
    canvasId: string,
    data: Record<string, unknown>,
    token: string,
  ): Promise<ElementResponseDTO> {
    const res = await fetch(base(canvasId), {
      method: "POST",
      headers: jsonAuthHeaders(token),
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleErrorResponse(res);
    return res.json();
  },

  async update(
    canvasId: string,
    elementId: string,
    data: Record<string, unknown>,
    token: string,
  ): Promise<ElementResponseDTO> {
    const res = await fetch(`${base(canvasId)}/${elementId}`, {
      method: "PATCH",
      headers: jsonAuthHeaders(token),
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleErrorResponse(res);
    return res.json();
  },

  async remove(canvasId: string, elementId: string, token: string): Promise<void> {
    const res = await fetch(`${base(canvasId)}/${elementId}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    if (!res.ok) return handleErrorResponse(res);
  },
};
