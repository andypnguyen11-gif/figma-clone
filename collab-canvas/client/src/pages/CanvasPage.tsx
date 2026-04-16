/**
 * CanvasPage — loads a canvas + its elements from the API on mount,
 * populates the Zustand stores, then renders the editor shell
 * (viewport, toolbar, property panel).
 *
 * Manual Save (top bar) and periodic auto-save persist elements: PATCH for
 * rows already loaded from the API, POST create for locally new shapes
 * (client UUIDs), then replace local ids with server ids. Keyboard
 * shortcuts are active on this page.
 */
import { useEffect, useState, useCallback, useRef } from "react";
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

/** Build POST body for creating an element (snake_case keys for the API). */
function elementToCreatePayload(el: CanvasElement): Record<string, unknown> {
  return {
    element_type: el.elementType,
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
  };
}

/** Build PATCH body for an element (snake_case keys for the API). */
function elementToPatchPayload(el: CanvasElement): Record<string, unknown> {
  return {
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

  /** Element ids returned from the API for this canvas (PATCH). Others are POST create first. */
  const persistedElementIdsRef = useRef<Set<string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

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
        persistedElementIdsRef.current = new Set(
          elementDTOs.map((row) => row.id),
        );
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

  const saveAllElements = useCallback(async (): Promise<void> => {
    if (!canvasId || !token) return;
    const persisted = persistedElementIdsRef.current;
    const snapshot = useElementStore.getState().getAllElements();

    for (const el of snapshot) {
      if (persisted.has(el.id)) {
        await elementsApi.update(
          canvasId,
          el.id,
          elementToPatchPayload(el),
          token,
        );
      } else {
        const dto = await elementsApi.create(
          canvasId,
          elementToCreatePayload(el),
          token,
        );
        const next = toElement(dto);
        useElementStore.getState().replaceElement(el.id, next);
        persisted.add(next.id);
      }
    }
  }, [canvasId, token]);

  const handleAutoSave = useCallback(() => {
    saveAllElements().catch(() => {
      /* auto-save is best-effort; errors are silent */
    });
  }, [saveAllElements]);

  const handleManualSave = useCallback(async () => {
    setSaveError(null);
    setSaveMessage(null);
    setIsSaving(true);
    try {
      await saveAllElements();
      setSaveMessage("Saved");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }, [saveAllElements]);

  useEffect(() => {
    if (!saveMessage) return;
    const t = window.setTimeout(() => setSaveMessage(null), 2000);
    return () => window.clearTimeout(t);
  }, [saveMessage]);

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
        <div className="canvas-top-bar-row">
          <button
            type="button"
            className="canvas-top-bar-btn"
            onClick={() => navigate("/dashboard")}
          >
            Home
          </button>
          <button
            type="button"
            className="canvas-top-bar-btn canvas-top-bar-btn--primary"
            aria-busy={isSaving}
            disabled={isSaving}
            title="Save all shapes to the server"
            onClick={() => void handleManualSave()}
          >
            {isSaving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            className="canvas-top-bar-btn canvas-top-bar-btn--danger"
            onClick={() => logout()}
          >
            Log out
          </button>
        </div>
        {saveError && (
          <div role="alert" className="canvas-save-feedback canvas-save-feedback--error">
            {saveError}
          </div>
        )}
        {saveMessage && (
          <div role="status" className="canvas-save-feedback canvas-save-feedback--ok" aria-live="polite">
            {saveMessage}
          </div>
        )}
      </header>
      <CanvasViewport />
      <Toolbar />
      <PropertyPanel />
    </>
  );
}
