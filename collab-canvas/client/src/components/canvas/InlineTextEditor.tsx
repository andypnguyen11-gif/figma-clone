/**
 * InlineTextEditor — HTML textarea overlay positioned on top of a
 * Konva Text element for direct-on-canvas text editing.
 *
 * The textarea is absolutely positioned to match the element's screen
 * coordinates (accounting for stage pan/zoom). On blur or Escape the
 * final text is committed via onComplete.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { Point } from "../../utils/geometry.ts";

interface InlineTextEditorProps {
  elementId: string;
  initialText: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  color: string;
  scale: number;
  stagePosition: Point;
  onComplete: (elementId: string, text: string) => void;
}

export function InlineTextEditor({
  elementId,
  initialText,
  x,
  y,
  width,
  height,
  fontSize,
  color,
  scale,
  stagePosition,
  onComplete,
}: InlineTextEditorProps) {
  const [text, setText] = useState(initialText);
  const ref = useRef<HTMLTextAreaElement>(null);
  const committed = useRef(false);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  const commit = useCallback(() => {
    if (committed.current) return;
    committed.current = true;
    onComplete(elementId, text);
  }, [elementId, text, onComplete]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        commit();
      }
    },
    [commit],
  );

  const screenX = x * scale + stagePosition.x;
  const screenY = y * scale + stagePosition.y;

  const style: React.CSSProperties = {
    position: "absolute",
    left: screenX,
    top: screenY,
    width: width * scale,
    minHeight: Math.max(height * scale, fontSize * scale + 4),
    fontSize: fontSize * scale,
    color,
    background: "transparent",
    border: "1px solid rgba(13,153,255,0.5)",
    borderRadius: 2,
    outline: "none",
    resize: "none",
    overflow: "hidden",
    fontFamily: "system-ui, -apple-system, sans-serif",
    lineHeight: 1.2,
    padding: 0,
    margin: 0,
    zIndex: 1000,
    boxSizing: "border-box",
  };

  return (
    <textarea
      ref={ref}
      role="textbox"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      style={style}
    />
  );
}
