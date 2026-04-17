/**
 * Callbacks for PR-16: reload authoritative REST state after a WebSocket session
 * comes back, and clear stale lock/presence overlays while the socket is down.
 */
import { useCallback, useRef } from "react";

import { useLockStore } from "../features/locking/lockStore.ts";
import { usePresenceStore } from "../features/presence/presenceStore.ts";

export interface UseReconnectParams {
  refreshState: () => Promise<void>;
}

export interface UseReconnectResult {
  onReconnect: () => Promise<void>;
  onConnectionLost: () => void;
}

export function useReconnect(params: UseReconnectParams): UseReconnectResult {
  const refreshRef = useRef(params.refreshState);
  refreshRef.current = params.refreshState;

  const onReconnect = useCallback(async () => {
    await refreshRef.current();
  }, []);

  const onConnectionLost = useCallback(() => {
    useLockStore.getState().clearLocks();
    usePresenceStore.getState().clearCursors();
  }, []);

  return { onReconnect, onConnectionLost };
}
