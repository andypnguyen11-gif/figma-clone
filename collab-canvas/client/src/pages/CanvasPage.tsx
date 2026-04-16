/**
 * CanvasPage — loads a canvas + its elements from the API on mount,
 * populates the Zustand stores, then renders the editor shell
 * (viewport, toolbar, property panel).
 *
 * Share link (top bar) calls GET /api/canvas/:id/share and copies `share_url`
 * to the clipboard for testing invites.
 *
 * Debounced save after element edits persists elements: PATCH for rows already
 * known to the API,
 * POST create for locally new shapes (client UUIDs), then replace local ids
 * with server ids. Remote WS element payloads register server ids so debounced
 * save does not duplicate-create. Keyboard shortcuts are active on this page.
 */
import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CanvasViewport from "../components/canvas/CanvasViewport.tsx";
import { Toolbar } from "../components/toolbar/Toolbar.tsx";
import { PropertyPanel } from "../components/properties/PropertyPanel.tsx";
import { useCanvasStore } from "../features/canvas/canvasStore.ts";
import { useElementStore } from "../features/elements/elementStore.ts";
import { mapElementDtoToCanvasElement } from "../features/elements/mapElementDto.ts";
import { idsRemovedFromCanvas } from "../features/elements/persistHelpers.ts";
import { processCanvasWsMessage } from "../features/elements/realtimeHandlers.ts";
import { useLockStore } from "../features/locking/lockStore.ts";
import { useLockManager } from "../features/locking/useLockManager.ts";
import { useAuthStore } from "../features/auth/authStore.ts";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts.ts";
import { useDebouncedSaveOnElementChange } from "../hooks/useDebouncedSaveOnElementChange.ts";
import { useCanvasWebSocket } from "../hooks/useCanvasWebSocket.ts";
import { canvasApi } from "../services/api/canvasApi.ts";
import { elementsApi } from "../services/api/elementsApi.ts";
import type { CanvasElement } from "../types/element.ts";
import type { Canvas } from "../types/canvas.ts";
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

export function CanvasPage() {
  const { canvasId } = useParams<{ canvasId: string }>();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const setCanvas = useCanvasStore((s) => s.setCanvas);
  const setElements = useElementStore((s) => s.setElements);
  const selectedElementId = useElementStore((s) => s.selectedElementId);

  /** Element ids returned from the API for this canvas (PATCH). Others are POST create first. */
  const persistedElementIdsRef = useRef<Set<string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareLinkError, setShareLinkError] = useState<string | null>(null);
  const [shareLinkMessage, setShareLinkMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasId || !token) return;

    let cancelled = false;
    useLockStore.getState().clearLocks();

    async function load() {
      try {
        const [canvasDTO, elementDTOs] = await Promise.all([
          canvasApi.get(canvasId!, token!),
          elementsApi.list(canvasId!, token!),
        ]);

        if (cancelled) return;

        setCanvas(toCanvas(canvasDTO));
        setElements(elementDTOs.map(mapElementDtoToCanvasElement));
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
    const currentIds = new Set(snapshot.map((el) => el.id));

    for (const id of idsRemovedFromCanvas(persisted, currentIds)) {
      try {
        await elementsApi.remove(canvasId, id, token);
        persisted.delete(id);
      } catch {
        /* best-effort background persist */
      }
    }

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
        const next = mapElementDtoToCanvasElement(dto);
        useElementStore.getState().replaceElement(el.id, next);
        persisted.add(next.id);
      }
    }
  }, [canvasId, token]);

  const persistElementsQuietly = useCallback(() => {
    saveAllElements().catch(() => {
      /* background persist is best-effort; errors are silent */
    });
  }, [saveAllElements]);

  const handleShareLink = useCallback(async () => {
    if (!canvasId || !token) return;
    setShareLinkError(null);
    setShareLinkMessage(null);
    setIsSharing(true);
    try {
      const data = await canvasApi.getShareInfo(canvasId, token);
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(data.share_url);
        setShareLinkMessage("Share link copied");
      } else {
        setShareLinkMessage(data.share_url);
      }
    } catch (err) {
      setShareLinkError(
        err instanceof Error ? err.message : "Could not get share link",
      );
    } finally {
      setIsSharing(false);
    }
  }, [canvasId, token]);

  useEffect(() => {
    if (!shareLinkMessage) return;
    const t = window.setTimeout(() => setShareLinkMessage(null), 2000);
    return () => window.clearTimeout(t);
  }, [shareLinkMessage]);

  useDebouncedSaveOnElementChange(persistElementsQuietly, {
    enabled: Boolean(canvasId && token && !loading && !error),
  });
  useKeyboardShortcuts();

  const handleWsMessage = useCallback((data: unknown) => {
    processCanvasWsMessage(data, {
      onLockDenied: (elementId) => {
        const sel = useElementStore.getState().selectedElementId;
        if (sel === elementId) {
          useElementStore.getState().setSelectedElementId(null);
        }
      },
      onRemoteElementPersisted: (elementId) => {
        persistedElementIdsRef.current.add(elementId);
      },
    });
  }, []);

  const {
    status: wsStatus,
    lastError: wsErrorMessage,
    hasCollaborators,
    sendJson,
  } = useCanvasWebSocket({
    canvasId: canvasId ?? null,
    token: token ?? null,
    enabled: Boolean(canvasId && token && !loading && !error),
    onMessage: handleWsMessage,
  });

  useLockManager({
    enabled: wsStatus === "live" && Boolean(canvasId),
    sendJson,
    selectedElementId,
  });

  useEffect(() => {
    return () => {
      useLockStore.getState().clearLocks();
    };
  }, []);

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
            className="canvas-top-bar-btn"
            aria-busy={isSharing}
            disabled={isSharing}
            title="Copy invite link for this canvas"
            onClick={() => void handleShareLink()}
          >
            {isSharing ? "Sharing…" : "Share link"}
          </button>
          <button
            type="button"
            className="canvas-top-bar-btn canvas-top-bar-btn--danger"
            onClick={() => logout()}
          >
            Log out
          </button>
        </div>
        {shareLinkError && (
          <div role="alert" className="canvas-save-feedback canvas-save-feedback--error">
            {shareLinkError}
          </div>
        )}
        {shareLinkMessage && (
          <div role="status" className="canvas-save-feedback canvas-save-feedback--ok" aria-live="polite">
            {shareLinkMessage}
          </div>
        )}
        {wsStatus === "live" && hasCollaborators && (
          <div role="status" className="canvas-save-feedback canvas-save-feedback--ok" aria-live="polite">
            Collaboration connected
          </div>
        )}
        {wsStatus === "error" && wsErrorMessage && (
          <div role="alert" className="canvas-save-feedback canvas-save-feedback--error">
            Real-time connection: {wsErrorMessage}
          </div>
        )}
      </header>
      <CanvasViewport />
      <Toolbar />
      <PropertyPanel />
    </>
  );
}
