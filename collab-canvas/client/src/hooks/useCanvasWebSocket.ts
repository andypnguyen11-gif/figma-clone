/**
 * Keeps an authenticated WebSocket open for the active canvas while the page is loaded.
 *
 * Reconnects when `canvasId` or `token` changes; disconnects on unmount. User callbacks
 * are kept in a ref so parent re-renders do not recreate the socket.
 */
import { useEffect, useRef, useState } from "react";
import { connectCanvasSocket } from "../services/websocket/canvasSocket.ts";

export type CanvasWsStatus = "offline" | "connecting" | "live" | "error";

export interface UseCanvasWebSocketOptions {
  canvasId: string | null;
  token: string | null;
  enabled: boolean;
  /** Receives every JSON payload from the server (including `connected`). */
  onMessage?: (data: unknown) => void;
}

interface UseCanvasWebSocketResult {
  status: CanvasWsStatus;
  lastError: string | null;
}

export function useCanvasWebSocket(
  options: UseCanvasWebSocketOptions,
): UseCanvasWebSocketResult {
  const [status, setStatus] = useState<CanvasWsStatus>("offline");
  const [lastError, setLastError] = useState<string | null>(null);
  const onMessageRef = useRef(options.onMessage);
  onMessageRef.current = options.onMessage;

  useEffect(() => {
    if (!options.enabled || !options.canvasId || !options.token) {
      setStatus("offline");
      return;
    }

    setStatus("connecting");
    setLastError(null);

    const handle = connectCanvasSocket({
      canvasId: options.canvasId,
      token: options.token,
      onMessage: (data) => {
        onMessageRef.current?.(data);
        if (
          typeof data === "object" &&
          data !== null &&
          "event" in data &&
          (data as { event: string }).event === "connected"
        ) {
          setStatus("live");
        }
      },
      onError: (err) => {
        setLastError(err.message);
        setStatus("error");
      },
      onClose: () => {
        setStatus("offline");
      },
    });

    return () => {
      handle.disconnect();
    };
  }, [options.enabled, options.canvasId, options.token]);

  return { status, lastError };
}
