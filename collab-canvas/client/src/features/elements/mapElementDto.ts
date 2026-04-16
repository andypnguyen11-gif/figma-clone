/**
 * Maps API element DTOs (snake_case) to client {@link CanvasElement} shape.
 * Shared by CanvasPage loading/save and WebSocket realtime merges.
 */
import type { CanvasElement } from "../../types/element.ts";
import type { ElementResponseDTO } from "../../services/api/elementsApi.ts";

export function mapElementDtoToCanvasElement(
  dto: ElementResponseDTO,
): CanvasElement {
  return {
    id: dto.id,
    canvasId: dto.canvas_id,
    elementType: dto.element_type as CanvasElement["elementType"],
    x: dto.x,
    y: dto.y,
    width: dto.width,
    height: dto.height,
    fill: dto.fill,
    stroke: dto.stroke,
    strokeWidth: dto.stroke_width,
    opacity: dto.opacity,
    rotation: dto.rotation,
    zIndex: dto.z_index,
    textContent: dto.text_content,
    fontSize: dto.font_size,
    textColor: dto.text_color,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}
