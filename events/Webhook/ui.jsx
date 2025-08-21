// nodes/webhook/ui.jsx
import { Handle, Position } from "@xyflow/react";

/** Truncate long URLs for display. */
function truncateUrl(url = "", max = 32) {
  if (!url) return "";
  if (url.length <= max) return url;
  const head = url.slice(0, Math.max(0, Math.floor(max * 0.6)));
  const tail = url.slice(-Math.max(0, Math.floor(max * 0.3)));
  return `${head}…${tail}`;
}

/**
 * Read-only node box for the canvas.
 * Shows: title, method pill, truncated URL, single target handle.
 */
export default function WebhookNode({ data }) {
  const method = (data?.method || "POST").toUpperCase();
  const url = data?.url || "";
  const urlShort = truncateUrl(url);

  return (
    <div
      style={{
        padding: 12,
        border: "1px solid #cbd5e1",
        borderRadius: 10,
        background: "white",
        minWidth: 240,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 6,
        }}
      >
        <div
          style={{
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>Webhook</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 400,
              lineHeight: 1,
              padding: "4px 6px",
              borderRadius: 6,
              border: "1px solid #e2e8f0",
              color: "#475569",
              background: "#f8fafc",
            }}
          >
            Event
          </span>
        </div>
      </div>

      {/* Method + URL */}
      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 12, color: "#374151" }}>Type</div>
          <span
            style={{
              fontSize: 12,
              padding: "2px 8px",
              border: "1px solid #e2e8f0",
              borderRadius: 999,
              background: "#f8fafc",
              fontWeight: 600,
            }}
          >
            {method}
          </span>
        </div>

        <div style={{ fontSize: 12, color: "#374151" }}>
          {url ? urlShort : "No URL set"}
        </div>
      </div>

      {/* Handles */}
      <Handle id="in" type="target" position={Position.Left} />
      {/* Optional: expose a response handle; keep it simple if you prefer sink-only */}
      <Handle id="response" type="source" position={Position.Right} />
    </div>
  );
}
