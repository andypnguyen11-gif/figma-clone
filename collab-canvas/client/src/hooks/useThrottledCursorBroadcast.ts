/**
 * Throttles outbound ``cursor:move`` JSON to the WebSocket (~50ms) so we do
 * not flood the server while the pointer moves. Uses a leading-edge throttle:
 * the first move in a window is sent; additional moves inside the window are
 * dropped until the interval elapses.
 *
 * @param sendJson - Socket helper from ``useCanvasWebSocket``
 * @param enabled - When false, calls are ignored (e.g. socket not live)
 * @param intervalMs - Minimum milliseconds between sends (default 50)
 */
import { useCallback, useRef } from "react";

const DEFAULT_INTERVAL_MS = 50;

export function useThrottledCursorBroadcast(
  sendJson: (payload: unknown) => void,
  enabled: boolean,
  intervalMs: number = DEFAULT_INTERVAL_MS,
): (canvasX: number, canvasY: number) => void {
  const lastSentAt = useRef(0);
  const sendRef = useRef(sendJson);
  sendRef.current = sendJson;

  return useCallback(
    (canvasX: number, canvasY: number) => {
      if (!enabled) return;
      const now = Date.now();
      if (now - lastSentAt.current < intervalMs) return;
      lastSentAt.current = now;
      sendRef.current({ event: "cursor:move", x: canvasX, y: canvasY });
    },
    [enabled, intervalMs],
  );
}
