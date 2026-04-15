/**
 * Presence store — tracks remote users' cursors and online status.
 *
 * Cursor positions are high-frequency updates (throttled to ~50ms on
 * the sending side). The store holds a Map of userId → cursor info
 * so the PresenceLayer can render each remote cursor efficiently.
 */
import { create } from "zustand";

export interface RemoteCursor {
  userId: string;
  userName: string;
  color: string;
  x: number;
  y: number;
}

interface PresenceState {
  cursors: Map<string, RemoteCursor>;

  setCursor: (cursor: RemoteCursor) => void;
  removeCursor: (userId: string) => void;
  clearCursors: () => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  cursors: new Map(),

  setCursor: (cursor) =>
    set((state) => {
      const next = new Map(state.cursors);
      next.set(cursor.userId, cursor);
      return { cursors: next };
    }),

  removeCursor: (userId) =>
    set((state) => {
      const next = new Map(state.cursors);
      next.delete(userId);
      return { cursors: next };
    }),

  clearCursors: () => set({ cursors: new Map() }),
}));
