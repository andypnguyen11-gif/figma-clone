/**
 * PropertyPanel — right-side panel for editing the selected element's
 * visual properties: fill, stroke, opacity, rotation, and z-ordering.
 *
 * Only rendered when an element is selected. Text elements get additional
 * font-size and text-color controls. All changes are applied immediately
 * to the element store so the canvas reflects edits in real time.
 */
import React, { useCallback, useRef } from "react";
import { useElementStore } from "../../features/elements/elementStore.ts";
import { pushSnapshot } from "../../features/history/useUndoRedo.ts";
import type { ElementUpdatePayload } from "../../types/element.ts";

export const PropertyPanel = React.memo(function PropertyPanel() {
  const selectedElementId = useElementStore((s) => s.selectedElementId);
  const element = useElementStore((s) =>
    s.selectedElementId ? s.elements.get(s.selectedElementId) : undefined,
  );
  const updateElement = useElementStore((s) => s.updateElement);

  /**
   * Debounce guard — push one undo snapshot per rapid-fire edit burst
   * (e.g. dragging a slider). Captures state on the first change,
   * then ignores subsequent pushes within 300ms.
   */
  const lastPushTime = useRef(0);
  const DEBOUNCE_MS = 300;

  const applyChange = useCallback(
    (changes: ElementUpdatePayload) => {
      if (!selectedElementId) return;
      const now = Date.now();
      if (now - lastPushTime.current > DEBOUNCE_MS) {
        pushSnapshot();
        lastPushTime.current = now;
      }
      updateElement(selectedElementId, changes);
    },
    [selectedElementId, updateElement],
  );

  if (!element) return null;

  const isText = element.elementType === "text";

  return (
    <div className="property-panel" data-testid="property-panel">
      <div className="pp-header">
        <span className="pp-type-badge">{element.elementType}</span>
        Properties
      </div>

      <div className="pp-section">
        <ColorField
          label="Fill"
          value={element.fill}
          onChange={(v) => applyChange({ fill: v })}
        />
        <ColorField
          label="Stroke color"
          value={element.stroke}
          onChange={(v) => applyChange({ stroke: v })}
        />
        <NumberField
          label="Stroke width"
          value={element.strokeWidth}
          min={0}
          max={100}
          step={1}
          onChange={(v) => applyChange({ strokeWidth: v })}
        />
      </div>

      <div className="pp-section">
        <RangeField
          label="Opacity"
          value={element.opacity}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => applyChange({ opacity: v })}
        />
        <NumberField
          label="Rotation"
          value={element.rotation}
          min={-360}
          max={360}
          step={1}
          suffix="°"
          onChange={(v) => applyChange({ rotation: v })}
        />
      </div>

      <div className="pp-section pp-z-row">
        <span className="pp-label">Layer</span>
        <div className="pp-z-buttons">
          <button
            className="pp-btn"
            aria-label="Send backward"
            onClick={() =>
              applyChange({ zIndex: Math.max(0, element.zIndex - 1) })
            }
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path
                d="M7 14l5 5 5-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            className="pp-btn"
            aria-label="Bring forward"
            onClick={() => applyChange({ zIndex: element.zIndex + 1 })}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path
                d="M7 10l5-5 5 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {isText && (
        <div className="pp-section">
          <NumberField
            label="Font size"
            value={element.fontSize ?? 16}
            min={1}
            max={999}
            step={1}
            suffix="px"
            onChange={(v) => applyChange({ fontSize: v })}
          />
          <ColorField
            label="Text color"
            value={element.textColor ?? "#000000"}
            onChange={(v) => applyChange({ textColor: v })}
          />
        </div>
      )}
    </div>
  );
});

/* ---------- field sub-components ---------- */

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

/** Native color picker with a hex text display. */
function ColorField({ label, value, onChange }: ColorFieldProps) {
  const id = `pp-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="pp-field">
      <label className="pp-label" htmlFor={id}>
        {label}
      </label>
      <div className="pp-color-wrapper">
        <input
          id={id}
          type="color"
          className="pp-color-input"
          value={value}
          onInput={(e) =>
            onChange((e.target as HTMLInputElement).value.toUpperCase())
          }
        />
        <span className="pp-color-hex">{value}</span>
      </div>
    </div>
  );
}

interface NumberFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}

function NumberField({ label, value, min, max, step, suffix, onChange }: NumberFieldProps) {
  const id = `pp-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="pp-field">
      <label className="pp-label" htmlFor={id}>
        {label}
      </label>
      <div className="pp-number-wrapper">
        <input
          id={id}
          type="number"
          className="pp-number-input"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const parsed = parseFloat(e.target.value);
            if (!Number.isNaN(parsed)) onChange(parsed);
          }}
        />
        {suffix && <span className="pp-suffix">{suffix}</span>}
      </div>
    </div>
  );
}

interface RangeFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

/** Slider + numeric readout for continuous values like opacity. */
function RangeField({ label, value, min, max, step, onChange }: RangeFieldProps) {
  const id = `pp-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="pp-field">
      <label className="pp-label" htmlFor={id}>
        {label}
      </label>
      <div className="pp-range-wrapper">
        <input
          id={id}
          type="range"
          className="pp-range-input"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
        <span className="pp-range-value">{value.toFixed(2)}</span>
      </div>
    </div>
  );
}
