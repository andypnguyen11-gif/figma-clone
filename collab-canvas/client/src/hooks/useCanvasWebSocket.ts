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
  /** True when the server reports at least two sockets in this canvas room (you + someone else). */
  hasCollaborators: boolean;
  /** Outbound JSON helper (no-ops until the socket is ready). */
  sendJson: (payload: unknown) => void;
}

function isRoomPeersPayload(data: unknown): data is {
  event: "room:peers";
  peer_count: number;
} {
  return (
    typeof data === "object" &&
    data !== null &&
    "event" in data &&
    (data as { event: string }).event === "room:peers" &&
    "peer_count" in data &&
    typeof (data as { peer_count: unknown }).peer_count === "number"
  );
}

export function useCanvasWebSocket(
  options: UseCanvasWebSocketOptions,
): UseCanvasWebSocketResult {
  const [status, setStatus] = useState<CanvasWsStatus>("offline");
  const [lastError, setLastError] = useState<string | null>(null);
  const [peerCount, setPeerCount] = useState<number | null>(null);
  const onMessageRef = useRef(options.onMessage);
  onMessageRef.current = options.onMessage;
  const sendJsonRef = useRef<(payload: unknown) => void>(() => {});

  const hasCollaborators = peerCount !== null && peerCount >= 2;

  useEffect(() => {
    if (!options.enabled || !options.canvasId || !options.token) {
      sendJsonRef.current = () => {};
      setStatus("offline");
      setPeerCount(null);
      return;
    }

    setStatus("connecting");
    setLastError(null);
    setPeerCount(null);

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
        if (isRoomPeersPayload(data)) {
          setPeerCount(data.peer_count);
        }
      },
      onError: (err) => {
        setLastError(err.message);
        setStatus("error");
        setPeerCount(null);
      },
      onClose: () => {
        setStatus("offline");
        setPeerCount(null);
      },
    });
    sendJsonRef.current = handle.sendJson;

    return () => {
      sendJsonRef.current = () => {};
      handle.disconnect();
    };
  }, [options.enabled, options.canvasId, options.token]);

  const sendJson = (payload: unknown) => {
    sendJsonRef.current(payload);
  };

  return { status, lastError, hasCollaborators, sendJson };
}
