// nodes/core/Constant/ui.jsx
import { Handle, Position } from "@xyflow/react";

/**
 * Presentational UI for the "core.constant" node.
 * - Displays the current value (read from node.data.value)
 * - Exposes a single source handle "value"
 * - Editing is done in the Inspector; this component is read-only
 */
export default function ConstantNode({ data }) {
  const value = data?.value ?? null;

  const type =
    value === null ? "null" : Array.isArray(value) ? "array" : typeof value; // "string" | "number" | "boolean" | "object"

  const preview = formatPreview(value);

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 10,
        border: "1px solid #cbd5e1",
        background: "white",
        minWidth: 180,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        display: "grid",
        gap: 8,
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ fontWeight: 800 }}>Constant</div>
        <TypePill type={type} />
      </div>

      <ValueBox preview={preview} />

      {/* Single output handle: "value" */}
      <Handle
        id="value"
        type="source"
        position={Position.Right}
        style={{ right: -8, top: "50%", transform: "translateY(-50%)" }}
        title="value"
      />
    </div>
  );
}

function TypePill({ type }) {
  return (
    <span
      style={{
        fontSize: 11,
        lineHeight: 1,
        padding: "4px 6px",
        borderRadius: 6,
        border: "1px solid #e2e8f0",
        color: "#475569",
        background: "#f8fafc",
      }}
    >
      {type}
    </span>
  );
}

function ValueBox({ preview }) {
  const isMultiline = preview.includes("\n");
  const common = {
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
    fontSize: 12,
    color: "#111827",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "8px 10px",
  };

  if (isMultiline) {
    return (
      <pre
        style={{
          ...common,
          margin: 0,
          whiteSpace: "pre-wrap",
          maxHeight: 180,
          overflow: "auto",
        }}
      >
        {preview}
      </pre>
    );
  }

  return (
    <div
      style={{
        ...common,
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        overflow: "hidden",
      }}
      title={preview}
    >
      {preview}
    </div>
  );
}

function formatPreview(v, maxLen = 300) {
  try {
    if (v === null) return "null";
    const t = typeof v;
    if (t === "string") return clamp(v, maxLen);
    if (t === "number" || t === "boolean") return String(v);
    // object/array -> pretty JSON
    const json = JSON.stringify(v, null, 2);
    return clamp(json, maxLen);
  } catch {
    // Fallback if value is not serializable
    return "[unrenderable]";
  }
}

function clamp(str, max) {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + "…";
}
