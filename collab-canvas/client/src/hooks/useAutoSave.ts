/**
 * useAutoSave — triggers a save callback every 10 minutes.
 *
 * Resets the interval when the page transitions from hidden → visible
 * (tab switch, screen lock) so the next save is always a full 10 minutes
 * after the user re-engages. Cleans up on unmount.
 *
 * @param onSave  - callback that persists the current canvas state
 * @param enabled - set to false to suspend auto-saving (e.g. when not authenticated)
 */
import { useEffect, useRef, useCallback } from "react";

const TEN_MINUTES = 10 * 60 * 1000;

export function useAutoSave(onSave: () => void, enabled = true): void {
  const savedCallback = useRef(onSave);
  savedCallback.current = onSave;

  const startInterval = useCallback(() => {
    return setInterval(() => {
      savedCallback.current();
    }, TEN_MINUTES);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let intervalId = startInterval();

    function handleVisibilityChange(): void {
      if (document.visibilityState === "visible") {
        clearInterval(intervalId);
        intervalId = startInterval();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, startInterval]);
}
