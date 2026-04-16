/**
 * Subscribes to {@link useElementStore} and invokes ``onSave`` after local edits
 * settle (debounced). Changes that only affect ``selectedElementId`` do not
 * trigger a save so selection does not spam the API.
 */
import { useEffect, useRef } from "react";

import { useElementStore } from "../features/elements/elementStore.ts";

export interface UseDebouncedSaveOnElementChangeOptions {
  enabled: boolean;
  /** Milliseconds to wait after the last elements change (default 650). */
  delayMs?: number;
}

export function useDebouncedSaveOnElementChange(
  onSave: () => void | Promise<void>,
  options: UseDebouncedSaveOnElementChangeOptions,
): void {
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!options.enabled) return;

    const delay = options.delayMs ?? 650;
    let prevElements = useElementStore.getState().elements;

    const schedule = () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        void Promise.resolve(onSaveRef.current());
      }, delay);
    };

    const unsub = useElementStore.subscribe((state) => {
      if (state.elements === prevElements) return;
      prevElements = state.elements;
      schedule();
    });

    return () => {
      unsub();
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [options.enabled, options.delayMs]);
}
