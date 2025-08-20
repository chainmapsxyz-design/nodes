// src/nodes/core/Formatter/ui.jsx
import { Handle, Position } from "@xyflow/react";

/**
 * Presentational UI for the "core.formatter" node.
 * - Shows title "Formatter" and a pill indicating mode ("JSON" | "string")
 * - Displays count of available variables
 * - Displays "Status: Valid/Invalid" based on current template/mode
 * - Exposes a single target handle "in" for inputs and a source handle "value" for output
 */
export default function FormatterNode({ data }) {
  const mode = data?.mode === "string" ? "string" : "json";
  const template =
    typeof data?.template === "string"
      ? data.template
      : mode === "json"
      ? "{\n  \n}"
      : "";
  const available = Array.isArray(data?.availableParams)
    ? data.availableParams
    : [];
  const varsCount = available.length;

  const valid = mode === "string" ? true : validateJsonTemplate(template);

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 10,
        border: "1px solid #cbd5e1",
        background: "white",
        minWidth: 220,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        display: "grid",
        gap: 8,
        position: "relative",
      }}
    >
      {/* Title row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ fontWeight: 800 }}>Formatter</div>
        <ModePill mode={mode} />
      </div>

      {/* Variables count */}
      <div style={{ fontSize: 12, color: "#475569" }}>
        Variables: <strong>{varsCount}</strong>
      </div>

      {/* Status */}
      <div style={{ fontSize: 12 }}>
        Status:{" "}
        <span style={{ color: valid ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
          {valid ? "Valid" : "Invalid"}
        </span>
      </div>

      {/* Handles */}
      <Handle
        id="in"
        type="target"
        position={Position.Left}
        style={{ left: -8, top: "50%", transform: "translateY(-50%)" }}
        title="inputs"
      />
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

function ModePill({ mode }) {
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
        textTransform: "none",
      }}
    >
      {mode === "json" ? "JSON" : "string"}
    </span>
  );
}

// --- Validation helpers (mirror inspector) ---
function looksLikeObjectOrArray(s = "") {
  const trimmed = s.trim();
  return /^(?:\{[\s\S]*\}|\[[\s\S]*\])$/.test(trimmed);
}

function validateJsonTemplate(s = "") {
  if (!looksLikeObjectOrArray(s)) return false;
  try {
    const substituted = s.replace(/\{\{[^}]+\}\}/g, "0");
    JSON.parse(substituted);
    return true;
  } catch {
    return false;
  }
}
