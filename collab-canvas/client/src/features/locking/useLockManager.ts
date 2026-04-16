/**
 * Sends WebSocket lock acquire / heartbeat / release tied to the current
 * selection. Heartbeat (~10s) matches the server TTL refresh window (30s).
 */
import { useEffect, useRef } from "react";

const HEARTBEAT_MS = 10_000;

export interface UseLockManagerParams {
  enabled: boolean;
  sendJson: (payload: unknown) => void;
  selectedElementId: string | null;
}

export function useLockManager(params: UseLockManagerParams): void {
  const { enabled, sendJson, selectedElementId } = params;
  const sendRef = useRef(sendJson);
  sendRef.current = sendJson;

  useEffect(() => {
    if (!enabled || !selectedElementId) {
      return;
    }
    const sid = selectedElementId;
    sendRef.current({
      event: "lock:acquire",
      element_id: sid,
    });
    const timer = window.setInterval(() => {
      sendRef.current({
        event: "lock:heartbeat",
        element_id: sid,
      });
    }, HEARTBEAT_MS);
    return () => {
      window.clearInterval(timer);
      sendRef.current({
        event: "lock:release",
        element_id: sid,
      });
    };
  }, [enabled, selectedElementId]);
}
