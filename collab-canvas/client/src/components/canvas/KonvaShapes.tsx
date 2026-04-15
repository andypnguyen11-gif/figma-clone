/**
 * Shape renderers — maps each CanvasElement to its Konva primitive.
 *
 * Rect, Circle, Line, RegularPolygon (triangle), and Text are supported.
 * Each shape reads styling from the element data and applies it directly
 * to the Konva node. Memoised to avoid re-renders when unrelated elements
 * change.
 */
import React from "react";
import { Circle, Line, Rect, RegularPolygon, Text } from "react-konva";
import type { CanvasElement } from "../../types/element.ts";
import { triangleRadius } from "../../utils/geometry.ts";

interface ShapeProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

/** Shared Konva node props derived from element styling. */
function commonProps(element: CanvasElement, isSelected: boolean) {
  return {
    x: element.x,
    y: element.y,
    fill: element.fill,
    stroke: isSelected ? "#0D99FF" : element.stroke,
    strokeWidth: isSelected ? 2 : element.strokeWidth,
    opacity: element.opacity,
    rotation: element.rotation,
    draggable: false,
  };
}

const RectShape = React.memo(function RectShape({
  element,
  isSelected,
  onSelect,
}: ShapeProps) {
  return (
    <Rect
      {...commonProps(element, isSelected)}
      width={element.width}
      height={element.height}
      onClick={() => onSelect(element.id)}
      onTap={() => onSelect(element.id)}
    />
  );
});

const CircleShape = React.memo(function CircleShape({
  element,
  isSelected,
  onSelect,
}: ShapeProps) {
  return (
    <Circle
      {...commonProps(element, isSelected)}
      radius={Math.max(element.width, element.height) / 2}
      onClick={() => onSelect(element.id)}
      onTap={() => onSelect(element.id)}
    />
  );
});

const LineShape = React.memo(function LineShape({
  element,
  isSelected,
  onSelect,
}: ShapeProps) {
  return (
    <Line
      {...commonProps(element, isSelected)}
      points={[0, 0, element.width, element.height]}
      onClick={() => onSelect(element.id)}
      onTap={() => onSelect(element.id)}
    />
  );
});

const TriangleShape = React.memo(function TriangleShape({
  element,
  isSelected,
  onSelect,
}: ShapeProps) {
  return (
    <RegularPolygon
      {...commonProps(element, isSelected)}
      sides={3}
      radius={triangleRadius(element.width, element.height)}
      onClick={() => onSelect(element.id)}
      onTap={() => onSelect(element.id)}
    />
  );
});

const TextShape = React.memo(function TextShape({
  element,
  isSelected,
  onSelect,
}: ShapeProps) {
  return (
    <Text
      {...commonProps(element, isSelected)}
      text={element.textContent ?? ""}
      fontSize={element.fontSize ?? 16}
      fill={element.textColor ?? element.fill}
      width={element.width}
      height={element.height}
      onClick={() => onSelect(element.id)}
      onTap={() => onSelect(element.id)}
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
  onSelect: (id: string) => void,
): React.ReactNode {
  const props: ShapeProps = { element, isSelected, onSelect };

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
