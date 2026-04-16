/**
 * Authenticated WebSocket client for canvas collaboration (`/api/canvas/:id/ws`).
 *
 * Mirrors the FastAPI handshake: ``GET ...?token=<JWT>``; first frames are JSON:
 * ``{ "event": "connected", "canvas_id": "<uuid>" }``, then
 * ``{ "event": "room:peers", "canvas_id": "<uuid>", "peer_count": <n> }`` (updated on every join/leave).
 */

export function buildCanvasWebSocketUrl(
  canvasId: string,
  token: string,
  locationLike: Pick<Location, "protocol" | "host">,
): string {
  const proto = locationLike.protocol === "https:" ? "wss" : "ws";
  const query = new URLSearchParams({ token });
  return `${proto}://${locationLike.host}/api/canvas/${encodeURIComponent(canvasId)}/ws?${query.toString()}`;
}

export interface ConnectCanvasSocketOptions {
  canvasId: string;
  token: string;
  /** Called for each decoded JSON object from the server. */
  onMessage: (data: unknown) => void;
  onError?: (err: Error) => void;
  onClose?: () => void;
  /** Defaults to `window.location` in the browser. */
  location?: Pick<Location, "protocol" | "host">;
}

export interface CanvasSocketHandle {
  disconnect: () => void;
}

export function connectCanvasSocket(
  options: ConnectCanvasSocketOptions,
): CanvasSocketHandle {
  const loc =
    options.location ??
    (typeof window !== "undefined"
      ? window.location
      : ({ protocol: "http:", host: "localhost" } satisfies Pick<
          Location,
          "protocol" | "host"
        >));

  const url = buildCanvasWebSocketUrl(options.canvasId, options.token, loc);
  const ws = new WebSocket(url);

  ws.onmessage = (ev: MessageEvent) => {
    try {
      const parsed: unknown = JSON.parse(String(ev.data));
      options.onMessage(parsed);
    } catch {
      options.onError?.(new Error("Invalid WebSocket message"));
    }
  };
  ws.onerror = () => {
    options.onError?.(new Error("WebSocket connection error"));
  };
  ws.onclose = () => {
    options.onClose?.();
  };

  return {
    disconnect: () => {
      ws.close();
    },
  };
}
