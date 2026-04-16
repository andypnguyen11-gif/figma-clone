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
  /**
   * Called after typing pauses so the element store can update text for
   * debounced autosave and realtime peers (without waiting for blur).
   */
  onDraftChange?: (elementId: string, text: string) => void;
  /** Milliseconds to wait after the last keystroke before onDraftChange (default 300). */
  draftDebounceMs?: number;
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
  onDraftChange,
  draftDebounceMs = 300,
  onComplete,
}: InlineTextEditorProps) {
  const [text, setText] = useState(initialText);
  const ref = useRef<HTMLTextAreaElement>(null);
  const committed = useRef(false);
  const latestTextRef = useRef(initialText);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onDraftChangeRef = useRef(onDraftChange);
  onDraftChangeRef.current = onDraftChange;

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  useEffect(
    () => () => {
      if (draftTimerRef.current !== null) {
        clearTimeout(draftTimerRef.current);
      }
    },
    [],
  );

  const scheduleDraft = useCallback(
    (next: string) => {
      latestTextRef.current = next;
      if (!onDraftChange) return;
      if (draftTimerRef.current !== null) {
        clearTimeout(draftTimerRef.current);
      }
      draftTimerRef.current = setTimeout(() => {
        draftTimerRef.current = null;
        onDraftChangeRef.current?.(elementId, latestTextRef.current);
      }, draftDebounceMs);
    },
    [onDraftChange, draftDebounceMs, elementId],
  );

  const flushDraft = useCallback(() => {
    if (draftTimerRef.current !== null) {
      clearTimeout(draftTimerRef.current);
      draftTimerRef.current = null;
    }
    if (onDraftChange) {
      onDraftChange(elementId, latestTextRef.current);
    }
  }, [onDraftChange, elementId]);

  const commit = useCallback(() => {
    if (committed.current) return;
    committed.current = true;
    flushDraft();
    onComplete(elementId, latestTextRef.current);
  }, [elementId, onComplete, flushDraft]);

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
      onChange={(e) => {
        const next = e.target.value;
        setText(next);
        latestTextRef.current = next;
        scheduleDraft(next);
      }}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      style={style}
    />
  );
}
