/**
 * Shape renderers — maps each CanvasElement to its Konva primitive.
 *
 * Rect, Circle, Line, RegularPolygon (triangle), and Text are supported.
 * Each shape reads styling from the element data and applies it directly
 * to the Konva node. Shapes register their Konva node in the parent's
 * ref map so the Transformer can attach to the selected shape.
 */
import React, { useCallback } from "react";
import { Circle, Line, Rect, RegularPolygon, Text } from "react-konva";
import type Konva from "konva";
import type { CanvasElement } from "../../types/element.ts";
import { triangleRadius } from "../../utils/geometry.ts";

interface ShapeProps {
  element: CanvasElement;
  isSelected: boolean;
  draggable: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDblClick: (id: string) => void;
  registerRef: (id: string, node: Konva.Node | null) => void;
}

function commonProps(
  element: CanvasElement,
  isSelected: boolean,
  draggable: boolean,
) {
  return {
    x: element.x,
    y: element.y,
    fill: element.fill,
    stroke: isSelected ? "#0D99FF" : element.stroke,
    strokeWidth: isSelected ? 2 : element.strokeWidth,
    opacity: element.opacity,
    rotation: element.rotation,
    draggable,
  };
}

function useShapeHandlers(props: ShapeProps) {
  const { element, onSelect, onDragEnd, onDblClick, registerRef } = props;

  const handleClick = useCallback(() => onSelect(element.id), [onSelect, element.id]);

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      onDragEnd(element.id, e.target.x(), e.target.y());
    },
    [onDragEnd, element.id],
  );

  const handleDblClick = useCallback(
    () => onDblClick(element.id),
    [onDblClick, element.id],
  );

  const refCallback = useCallback(
    (node: Konva.Node | null) => registerRef(element.id, node),
    [registerRef, element.id],
  );

  return { handleClick, handleDragEnd, handleDblClick, refCallback };
}

const RectShape = React.memo(function RectShape(props: ShapeProps) {
  const { element, isSelected, draggable } = props;
  const { handleClick, handleDragEnd, handleDblClick, refCallback } =
    useShapeHandlers(props);

  return (
    <Rect
      ref={refCallback as React.Ref<Konva.Rect>}
      {...commonProps(element, isSelected, draggable)}
      width={element.width}
      height={element.height}
      onClick={handleClick}
      onTap={handleClick}
      onDragEnd={handleDragEnd}
      onDblClick={handleDblClick}
      onDblTap={handleDblClick}
    />
  );
});

const CircleShape = React.memo(function CircleShape(props: ShapeProps) {
  const { element, isSelected, draggable } = props;
  const { handleClick, handleDragEnd, handleDblClick, refCallback } =
    useShapeHandlers(props);

  return (
    <Circle
      ref={refCallback as React.Ref<Konva.Circle>}
      {...commonProps(element, isSelected, draggable)}
      radius={Math.max(element.width, element.height) / 2}
      onClick={handleClick}
      onTap={handleClick}
      onDragEnd={handleDragEnd}
      onDblClick={handleDblClick}
      onDblTap={handleDblClick}
    />
  );
});

const LineShape = React.memo(function LineShape(props: ShapeProps) {
  const { element, isSelected, draggable } = props;
  const { handleClick, handleDragEnd, handleDblClick, refCallback } =
    useShapeHandlers(props);

  return (
    <Line
      ref={refCallback as React.Ref<Konva.Line>}
      {...commonProps(element, isSelected, draggable)}
      points={[0, 0, element.width, element.height]}
      onClick={handleClick}
      onTap={handleClick}
      onDragEnd={handleDragEnd}
      onDblClick={handleDblClick}
      onDblTap={handleDblClick}
    />
  );
});

const TriangleShape = React.memo(function TriangleShape(props: ShapeProps) {
  const { element, isSelected, draggable } = props;
  const { handleClick, handleDragEnd, handleDblClick, refCallback } =
    useShapeHandlers(props);

  return (
    <RegularPolygon
      ref={refCallback as React.Ref<Konva.RegularPolygon>}
      {...commonProps(element, isSelected, draggable)}
      sides={3}
      radius={triangleRadius(element.width, element.height)}
      onClick={handleClick}
      onTap={handleClick}
      onDragEnd={handleDragEnd}
      onDblClick={handleDblClick}
      onDblTap={handleDblClick}
    />
  );
});

const TextShape = React.memo(function TextShape(props: ShapeProps) {
  const { element, isSelected, draggable } = props;
  const { handleClick, handleDragEnd, handleDblClick, refCallback } =
    useShapeHandlers(props);

  return (
    <Text
      ref={refCallback as React.Ref<Konva.Text>}
      {...commonProps(element, isSelected, draggable)}
      text={element.textContent ?? ""}
      fontSize={element.fontSize ?? 16}
      fill={element.textColor ?? element.fill}
      width={element.width}
      height={element.height}
      onClick={handleClick}
      onTap={handleClick}
      onDragEnd={handleDragEnd}
      onDblClick={handleDblClick}
      onDblTap={handleDblClick}
    />
  );
});

/**
 * Render the correct Konva shape for a given element.
 * Returns null for unknown types so the canvas never crashes.
 */
export function renderShape(
  element: CanvasElement,
  isSelected: boolean,
  draggable: boolean,
  onSelect: (id: string) => void,
  onDragEnd: (id: string, x: number, y: number) => void,
  onDblClick: (id: string) => void,
  registerRef: (id: string, node: Konva.Node | null) => void,
): React.ReactNode {
  const props: ShapeProps = {
    element,
    isSelected,
    draggable,
    onSelect,
    onDragEnd,
    onDblClick,
    registerRef,
  };

  switch (element.elementType) {
    case "rectangle":
      return <RectShape key={element.id} {...props} />;
    case "circle":
      return <CircleShape key={element.id} {...props} />;
    case "line":
      return <LineShape key={element.id} {...props} />;
    case "triangle":
      return <TriangleShape key={element.id} {...props} />;
    case "text":
      return <TextShape key={element.id} {...props} />;
    default:
      return null;
  }
}
