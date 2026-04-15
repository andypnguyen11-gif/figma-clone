/**
 * Toolbar — vertical tool-selection bar on the left edge of the viewport.
 *
 * Each button maps to a ToolType. Clicking a tool updates canvasStore's
 * selectedTool and clears the current element selection so the user
 * can immediately start drawing.
 */
import React, { useCallback } from "react";
import { useCanvasStore } from "../../features/canvas/canvasStore.ts";
import { useElementStore } from "../../features/elements/elementStore.ts";
import type { ToolType } from "../../types/canvas.ts";

interface ToolDef {
  type: ToolType;
  label: string;
  /** Simple SVG path icon rendered in a 24×24 viewBox. */
  icon: React.ReactNode;
}

const TOOLS: ToolDef[] = [
  {
    type: "select",
    label: "Select",
    icon: (
      <path
        d="M4 2l12 9.5L10.5 13l3.5 8-2.5 1-3.5-8L4 18V2z"
        fill="currentColor"
      />
    ),
  },
  {
    type: "rectangle",
    label: "Rectangle",
    icon: (
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    ),
  },
  {
    type: "circle",
    label: "Circle",
    icon: (
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    ),
  },
  {
    type: "line",
    label: "Line",
    icon: (
      <line
        x1="4"
        y1="20"
        x2="20"
        y2="4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    ),
  },
  {
    type: "triangle",
    label: "Triangle",
    icon: (
      <polygon
        points="12,3 22,21 2,21"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    ),
  },
  {
    type: "text",
    label: "Text",
    icon: (
      <text
        x="12"
        y="17"
        textAnchor="middle"
        fontSize="16"
        fontWeight="bold"
        fill="currentColor"
      >
        T
      </text>
    ),
  },
];

const toolbarStyle: React.CSSProperties = {
  position: "fixed",
  left: 12,
  top: "50%",
  transform: "translateY(-50%)",
  display: "flex",
  flexDirection: "column",
  gap: 4,
  padding: 6,
  borderRadius: 12,
  background: "rgba(30, 30, 30, 0.92)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.08)",
  zIndex: 100,
  boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
};


export const Toolbar = React.memo(function Toolbar() {
  const selectedTool = useCanvasStore((s) => s.selectedTool);
  const setSelectedTool = useCanvasStore((s) => s.setSelectedTool);
  const setSelectedElementId = useElementStore((s) => s.setSelectedElementId);

  const handleToolClick = useCallback(
    (tool: ToolType) => {
      setSelectedTool(tool);
      setSelectedElementId(null);
    },
    [setSelectedTool, setSelectedElementId],
  );

  return (
    <div style={toolbarStyle} role="toolbar" aria-label="Drawing tools">
      {TOOLS.map(({ type, label, icon }) => {
        const active = selectedTool === type;
        return (
          <button
            key={type}
            className="toolbar-btn"
            aria-label={label}
            aria-pressed={active}
            title={label}
            onClick={() => handleToolClick(type)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              {icon}
            </svg>
          </button>
        );
      })}
    </div>
  );
});
