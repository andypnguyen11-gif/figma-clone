/**
 * Lock store — tracks which elements are locked and by whom.
 *
 * When a user selects an element, a lock:acquire event is sent via
 * WebSocket. The server grants or denies the lock. If granted, the
 * lock appears here so other clients can render the LockOverlay
 * (colored outline + owner name) on that element.
 */
import { create } from "zustand";

export interface LockInfo {
  userId: string;
  userName: string;
  color: string;
}

interface LockState {
  locks: Map<string, LockInfo>;

  setLock: (elementId: string, info: LockInfo) => void;
  releaseLock: (elementId: string) => void;
  clearLocks: () => void;
  isLockedByOther: (elementId: string, currentUserId: string) => boolean;
}

export const useLockStore = create<LockState>((set, get) => ({
  locks: new Map(),

  setLock: (elementId, info) =>
    set((state) => {
      const next = new Map(state.locks);
      next.set(elementId, info);
      return { locks: next };
    }),

  releaseLock: (elementId) =>
    set((state) => {
      const next = new Map(state.locks);
      next.delete(elementId);
      return { locks: next };
    }),

  clearLocks: () => set({ locks: new Map() }),

  isLockedByOther: (elementId, currentUserId) => {
    const lock = get().locks.get(elementId);
    return lock != null && lock.userId !== currentUserId;
  },
}));
