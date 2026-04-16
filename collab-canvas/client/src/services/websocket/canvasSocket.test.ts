/**
 * Tests for authenticated canvas WebSocket URL building and connection wrapper.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildCanvasWebSocketUrl,
  connectCanvasSocket,
} from "./canvasSocket.ts";

type MockWsInstance = {
  url: string;
  onopen: (() => void) | null;
  onmessage: ((ev: MessageEvent) => void) | null;
  onerror: (() => void) | null;
  onclose: (() => void) | null;
  close: () => void;
  simulate: (data: unknown) => void;
};

function installMockWebSocket(): () => void {
  const ctor = vi.fn(function MockWebSocket(this: MockWsInstance, url: string) {
    this.url = url;
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.onclose = null;
    this.close = () => this.onclose?.();
    this.simulate = (data: unknown) => {
      this.onmessage?.({ data: JSON.stringify(data) } as MessageEvent);
    };
  });
  vi.stubGlobal("WebSocket", ctor);
  return () => {
    vi.unstubAllGlobals();
  };
}

describe("buildCanvasWebSocketUrl", () => {
  it("builds ws URL with path and encoded token query", () => {
    const url = buildCanvasWebSocketUrl("abc-123", "tok&=",
      { protocol: "http:", host: "localhost:5173" });
    expect(url.startsWith("ws://localhost:5173/api/canvas/")).toBe(true);
    expect(url).toContain("/api/canvas/abc-123/ws?");
    expect(url).toContain(encodeURIComponent("tok&="));
  });

  it("uses wss when page is served over https", () => {
    const url = buildCanvasWebSocketUrl("c1", "t",
      { protocol: "https:", host: "app.example.com" });
    expect(url.startsWith("wss://app.example.com/api/canvas/")).toBe(true);
  });
});

describe("connectCanvasSocket", () => {
  let teardown: () => void;

  beforeEach(() => {
    teardown = installMockWebSocket();
  });

  afterEach(() => {
    teardown();
  });

  it("opens WebSocket with URL from buildCanvasWebSocketUrl", () => {
    const onMessage = vi.fn();
    connectCanvasSocket({
      canvasId: "cid",
      token: "jwt",
      location: { protocol: "http:", host: "localhost:5173" },
      onMessage,
    });
    expect(
      vi.mocked(WebSocket).mock.calls[0][0],
    ).toBe(
      "ws://localhost:5173/api/canvas/cid/ws?token=jwt",
    );
  });

  it("invokes onMessage with parsed JSON payloads", () => {
    const onMessage = vi.fn();
    connectCanvasSocket({
      canvasId: "cid",
      token: "jwt",
      location: { protocol: "http:", host: "h" },
      onMessage,
    });
    const instance = vi.mocked(WebSocket).mock
      .instances[0] as unknown as MockWsInstance;
    instance.simulate({ event: "connected", canvas_id: "cid" });
    expect(onMessage).toHaveBeenCalledWith({
      event: "connected",
      canvas_id: "cid",
    });
  });

  it("disconnect calls close on the socket", () => {
    const onMessage = vi.fn();
    const { disconnect } = connectCanvasSocket({
      canvasId: "cid",
      token: "jwt",
      location: { protocol: "http:", host: "h" },
      onMessage,
    });
    const Ctor = vi.mocked(WebSocket);
    const instance = Ctor.mock.instances[0] as unknown as MockWsInstance;
    const closeSpy = vi.spyOn(instance, "close");
    disconnect();
    expect(closeSpy).toHaveBeenCalled();
  });
});
