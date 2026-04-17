/**
 * Keeps an authenticated WebSocket open for the active canvas while the page is loaded.
 *
 * On transport failure, reconnects with exponential backoff (1s → 2s → … capped at 30s).
 * After a successful reconnect, `onReconnect` runs so the app can refetch REST state; while
 * offline, `onConnectionLost` clears ephemeral collaboration overlays (locks, remote cursors).
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
  /**
   * Called after the socket was lost and a new session receives `connected`.
   * Use to refetch canvas + elements (and merge); lock snapshot follows via WS.
   */
  onReconnect?: () => void | Promise<void>;
  /**
   * Called when the socket closes unexpectedly (not on intentional unmount-driven close).
   */
  onConnectionLost?: () => void;
}

interface UseCanvasWebSocketResult {
  status: CanvasWsStatus;
  lastError: string | null;
  /** True when the server reports at least two sockets in this canvas room (you + someone else). */
  hasCollaborators: boolean;
  /** Outbound JSON helper (no-ops until the socket is ready). */
  sendJson: (payload: unknown) => void;
}

const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30_000;

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
  const onReconnectRef = useRef(options.onReconnect);
  onReconnectRef.current = options.onReconnect;
  const onConnectionLostRef = useRef(options.onConnectionLost);
  onConnectionLostRef.current = options.onConnectionLost;

  const sendJsonRef = useRef<(payload: unknown) => void>(() => {});

  const hasCollaborators = peerCount !== null && peerCount >= 2;

  useEffect(() => {
    if (!options.enabled || !options.canvasId || !options.token) {
      sendJsonRef.current = () => {};
      setStatus("offline");
      setPeerCount(null);
      return;
    }

    let disposed = false;
    let intentionalDisconnect = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectPending = false;
    let nextBackoffMs = INITIAL_BACKOFF_MS;
    let handle: { disconnect: () => void; sendJson: (p: unknown) => void } | null =
      null;

    const clearReconnectTimer = () => {
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const scheduleReconnect = () => {
      clearReconnectTimer();
      const delay = nextBackoffMs;
      nextBackoffMs = Math.min(nextBackoffMs * 2, MAX_BACKOFF_MS);
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        if (!disposed) {
          connectNow();
        }
      }, delay);
    };

    const handleIncoming = (data: unknown) => {
      onMessageRef.current?.(data);
      if (
        typeof data === "object" &&
        data !== null &&
        "event" in data &&
        (data as { event: string }).event === "connected"
      ) {
        setStatus("live");
        nextBackoffMs = INITIAL_BACKOFF_MS;
        if (reconnectPending) {
          reconnectPending = false;
          void Promise.resolve(onReconnectRef.current?.()).catch(() => {
            /* refresh is best-effort */
          });
        }
      }
      if (isRoomPeersPayload(data)) {
        setPeerCount(data.peer_count);
      }
    };

    const connectNow = () => {
      if (disposed) return;
      setStatus("connecting");
      setLastError(null);
      setPeerCount(null);

      handle = connectCanvasSocket({
        canvasId: options.canvasId!,
        token: options.token!,
        onMessage: handleIncoming,
        onError: (err) => {
          setLastError(err.message);
          setStatus("error");
          setPeerCount(null);
        },
        onClose: () => {
          sendJsonRef.current = () => {};
          if (intentionalDisconnect) {
            return;
          }
          setStatus("offline");
          setPeerCount(null);
          reconnectPending = true;
          onConnectionLostRef.current?.();
          if (!disposed) {
            scheduleReconnect();
          }
        },
      });
      sendJsonRef.current = handle.sendJson;
    };

    connectNow();

    return () => {
      disposed = true;
      intentionalDisconnect = true;
      clearReconnectTimer();
      sendJsonRef.current = () => {};
      handle?.disconnect();
    };
  }, [options.enabled, options.canvasId, options.token]);

  const sendJson = (payload: unknown) => {
    sendJsonRef.current(payload);
  };

  return { status, lastError, hasCollaborators, sendJson };
}
