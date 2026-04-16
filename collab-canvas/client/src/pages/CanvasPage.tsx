/**
 * CanvasPage — loads a canvas + its elements from the API on mount,
 * populates the Zustand stores, then renders the editor shell
 * (viewport, toolbar, property panel).
 *
 * Also activates the auto-save hook and keyboard shortcuts.
 */
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CanvasViewport from "../components/canvas/CanvasViewport.tsx";
import { Toolbar } from "../components/toolbar/Toolbar.tsx";
import { PropertyPanel } from "../components/properties/PropertyPanel.tsx";
import { useCanvasStore } from "../features/canvas/canvasStore.ts";
import { useElementStore } from "../features/elements/elementStore.ts";
import { useAuthStore } from "../features/auth/authStore.ts";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts.ts";
import { useAutoSave } from "../hooks/useAutoSave.ts";
import { canvasApi } from "../services/api/canvasApi.ts";
import { elementsApi } from "../services/api/elementsApi.ts";
import type { CanvasElement } from "../types/element.ts";
import type { Canvas } from "../types/canvas.ts";
import type { ElementResponseDTO } from "../services/api/elementsApi.ts";
import type { CanvasResponseDTO } from "../services/api/canvasApi.ts";

/** Map a server canvas DTO (snake_case) → client Canvas (camelCase). */
function toCanvas(dto: CanvasResponseDTO): Canvas {
  return {
    id: dto.id,
    title: dto.title,
    ownerId: dto.owner_id,
    shareToken: dto.share_token,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

/** Map a server element DTO (snake_case) → client CanvasElement (camelCase). */
function toElement(dto: ElementResponseDTO): CanvasElement {
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

export function CanvasPage() {
  const { canvasId } = useParams<{ canvasId: string }>();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const setCanvas = useCanvasStore((s) => s.setCanvas);
  const setElements = useElementStore((s) => s.setElements);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasId || !token) return;

    let cancelled = false;

    async function load() {
      try {
        const [canvasDTO, elementDTOs] = await Promise.all([
          canvasApi.get(canvasId!, token!),
          elementsApi.list(canvasId!, token!),
        ]);

        if (cancelled) return;

        setCanvas(toCanvas(canvasDTO));
        setElements(elementDTOs.map(toElement));
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load canvas");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [canvasId, token, setCanvas, setElements]);

  const handleAutoSave = useCallback(() => {
    if (!canvasId || !token) return;
    const elements = useElementStore.getState().getAllElements();
    for (const el of elements) {
      elementsApi
        .update(
          canvasId,
          el.id,
          {
            x: el.x,
            y: el.y,
            width: el.width,
            height: el.height,
            fill: el.fill,
            stroke: el.stroke,
            stroke_width: el.strokeWidth,
            opacity: el.opacity,
            rotation: el.rotation,
            z_index: el.zIndex,
            text_content: el.textContent,
            font_size: el.fontSize,
            text_color: el.textColor,
          },
          token,
        )
        .catch(() => {
          /* auto-save is best-effort; errors are silent */
        });
    }
  }, [canvasId, token]);

  useAutoSave(handleAutoSave, !loading && !error);
  useKeyboardShortcuts();

  if (loading) {
    return (
      <div className="canvas-loading">
        <p>Loading canvas…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="canvas-error" role="alert">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <>
      <header className="canvas-top-bar">
        <button
          type="button"
          className="canvas-top-bar-btn"
          onClick={() => navigate("/")}
        >
          Home
        </button>
        <button
          type="button"
          className="canvas-top-bar-btn canvas-top-bar-btn--danger"
          onClick={() => logout()}
        >
          Log out
        </button>
      </header>
      <CanvasViewport />
      <Toolbar />
      <PropertyPanel />
    </>
  );
}
