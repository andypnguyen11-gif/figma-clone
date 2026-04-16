import { describe, it, expect, beforeEach } from "vitest";
import { useElementStore } from "./elementStore.ts";
import type { CanvasElement } from "../../types/element.ts";

const makeElement = (overrides: Partial<CanvasElement> = {}): CanvasElement => ({
  id: "e1",
  canvasId: "c1",
  elementType: "rectangle",
  x: 0,
  y: 0,
  width: 100,
  height: 50,
  fill: "#FFFFFF",
  stroke: "#000000",
  strokeWidth: 1,
  opacity: 1,
  rotation: 0,
  zIndex: 0,
  textContent: null,
  fontSize: null,
  textColor: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

describe("elementStore", () => {
  beforeEach(() => {
    useElementStore.setState({
      elements: new Map(),
      selectedElementId: null,
      editingTextElementId: null,
    });
  });

  it("starts empty", () => {
    expect(useElementStore.getState().getAllElements()).toHaveLength(0);
    expect(useElementStore.getState().selectedElementId).toBeNull();
  });

  it("sets elements from an array", () => {
    const elements = [makeElement({ id: "e1" }), makeElement({ id: "e2" })];
    useElementStore.getState().setElements(elements);
    expect(useElementStore.getState().getAllElements()).toHaveLength(2);
  });

  it("adds an element", () => {
    useElementStore.getState().addElement(makeElement({ id: "e1" }));
    expect(useElementStore.getState().getElement("e1")).toBeDefined();
  });

  it("updates an element", () => {
    useElementStore.getState().addElement(makeElement({ id: "e1", x: 0 }));
    useElementStore.getState().updateElement("e1", { x: 200, fill: "#FF0000" });

    const el = useElementStore.getState().getElement("e1");
    expect(el?.x).toBe(200);
    expect(el?.fill).toBe("#FF0000");
  });

  it("ignores updates to non-existent elements", () => {
    useElementStore.getState().updateElement("ghost", { x: 100 });
    expect(useElementStore.getState().getAllElements()).toHaveLength(0);
  });

  it("removes an element", () => {
    useElementStore.getState().addElement(makeElement({ id: "e1" }));
    useElementStore.getState().removeElement("e1");
    expect(useElementStore.getState().getElement("e1")).toBeUndefined();
  });

  it("clears selection when selected element is removed", () => {
    useElementStore.getState().addElement(makeElement({ id: "e1" }));
    useElementStore.getState().setSelectedElementId("e1");
    useElementStore.getState().removeElement("e1");
    expect(useElementStore.getState().selectedElementId).toBeNull();
  });

  it("preserves selection when a different element is removed", () => {
    useElementStore.getState().addElement(makeElement({ id: "e1" }));
    useElementStore.getState().addElement(makeElement({ id: "e2" }));
    useElementStore.getState().setSelectedElementId("e1");
    useElementStore.getState().removeElement("e2");
    expect(useElementStore.getState().selectedElementId).toBe("e1");
  });

  it("replaceElement swaps a local id for the server element and keeps selection", () => {
    const local = makeElement({ id: "local-temp" });
    const server = makeElement({ id: "server-id", x: 5 });
    useElementStore.getState().addElement(local);
    useElementStore.getState().setSelectedElementId("local-temp");
    useElementStore.getState().replaceElement("local-temp", server);

    expect(useElementStore.getState().getElement("local-temp")).toBeUndefined();
    expect(useElementStore.getState().getElement("server-id")?.x).toBe(5);
    expect(useElementStore.getState().selectedElementId).toBe("server-id");
  });

  it("replaceElement remaps editingTextElementId when the edited row gets a server id", () => {
    const local = makeElement({ id: "local-text", elementType: "text" });
    const server = makeElement({ id: "server-text", elementType: "text" });
    useElementStore.getState().addElement(local);
    useElementStore.getState().setEditingTextElementId("local-text");
    useElementStore.getState().replaceElement("local-text", server);

    expect(useElementStore.getState().editingTextElementId).toBe("server-text");
  });

  it("upsertElement inserts or replaces with a newer updatedAt", () => {
    useElementStore.getState().addElement(makeElement({ id: "e1", x: 0 }));
    useElementStore
      .getState()
      .upsertElement(
        makeElement({
          id: "e1",
          x: 99,
          updatedAt: "2026-02-01T00:00:00Z",
        }),
      );
    expect(useElementStore.getState().getElement("e1")?.x).toBe(99);
  });

  it("upsertElement ignores stale server rows", () => {
    useElementStore.getState().addElement(
      makeElement({ id: "e1", x: 50, updatedAt: "2026-06-01T00:00:00Z" }),
    );
    useElementStore
      .getState()
      .upsertElement(
        makeElement({
          id: "e1",
          x: 0,
          updatedAt: "2026-01-01T00:00:00Z",
        }),
      );
    expect(useElementStore.getState().getElement("e1")?.x).toBe(50);
  });
});
