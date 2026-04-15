import { describe, it, expect, beforeEach } from "vitest";
import { useLockStore } from "./lockStore.ts";

describe("lockStore", () => {
  beforeEach(() => {
    useLockStore.setState({ locks: new Map() });
  });

  it("starts with no locks", () => {
    expect(useLockStore.getState().locks.size).toBe(0);
  });

  it("sets a lock on an element", () => {
    useLockStore.getState().setLock("e1", {
      userId: "u1",
      userName: "Alice",
      color: "#FF0000",
    });
    expect(useLockStore.getState().locks.get("e1")?.userName).toBe("Alice");
  });

  it("releases a lock", () => {
    useLockStore.getState().setLock("e1", {
      userId: "u1",
      userName: "Alice",
      color: "#FF0000",
    });
    useLockStore.getState().releaseLock("e1");
    expect(useLockStore.getState().locks.has("e1")).toBe(false);
  });

  it("detects lock by another user", () => {
    useLockStore.getState().setLock("e1", {
      userId: "u2",
      userName: "Bob",
      color: "#00FF00",
    });
    expect(useLockStore.getState().isLockedByOther("e1", "u1")).toBe(true);
    expect(useLockStore.getState().isLockedByOther("e1", "u2")).toBe(false);
  });

  it("returns false for unlocked elements", () => {
    expect(useLockStore.getState().isLockedByOther("e1", "u1")).toBe(false);
  });

  it("clears all locks", () => {
    useLockStore.getState().setLock("e1", { userId: "u1", userName: "A", color: "#F00" });
    useLockStore.getState().setLock("e2", { userId: "u2", userName: "B", color: "#0F0" });
    useLockStore.getState().clearLocks();
    expect(useLockStore.getState().locks.size).toBe(0);
  });
});
