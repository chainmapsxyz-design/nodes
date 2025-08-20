// nodes/webhook/inspector.jsx
import { useEffect, useMemo, useState } from "react";

/**
 * Inspector for "events.webhook"
 *
 * Props:
 * - node: { id, type, data }
 * - value: node.data (object)
 * - onChange: (nextData) => void
 */
export default function WebhookInspector({ node, value, onChange }) {
  const initial = useMemo(
    () => ({
      method: value?.method ?? "POST",
      url: value?.url ?? "",
      headers:
        Array.isArray(value?.headers) && value.headers.length > 0
          ? value.headers
          : [{ key: "Content-Type", value: "application/json" }],
      timeoutMs: Number.isFinite(value?.timeoutMs) ? value.timeoutMs : 10000,
    }),
    [node?.id] // re-init if node changes
  );

  const [method, setMethod] = useState(initial.method);
  const [url, setUrl] = useState(initial.url);
  const [headers, setHeaders] = useState(initial.headers);
  const [timeoutMs, setTimeoutMs] = useState(initial.timeoutMs);

  // Sync down if external changes update node.data
  useEffect(() => {
    setMethod(initial.method);
    setUrl(initial.url);
    setHeaders(initial.headers);
    setTimeoutMs(initial.timeoutMs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.method, initial.url, initial.timeoutMs]);

  // Push up to graph state
  useEffect(() => {
    const cleaned = (headers || [])
      .filter((h) => String(h.key || "").trim().length > 0)
      .map((h) => ({ key: String(h.key), value: String(h.value ?? "") }));

    onChange({
      ...value,
      method,
      url,
      headers: cleaned,
      timeoutMs: Number(timeoutMs) || 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, url, headers, timeoutMs]);

  function updateHeader(idx, patch) {
    setHeaders((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }

  function addHeader() {
    setHeaders((prev) => [...prev, { key: "", value: "" }]);
  }

  function removeHeader(idx) {
    setHeaders((prev) => prev.filter((_, i) => i !== idx));
  }

  // Reusable control base to ensure no overflow
  const controlBase = {
    padding: "8px 10px",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    background: "white",
    boxSizing: "border-box",
    maxWidth: "100%",
  };

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        minWidth: 0, // allow shrink inside flex parents
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 16 }}>Webhook</div>

      {/* Method */}
      <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600 }}>Method</div>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          style={controlBase}
        >
          {["POST", "GET", "PUT", "PATCH", "DELETE"].map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>

      {/* URL */}
      <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600 }}>Request URL</div>
        <input
          type="url"
          placeholder="https://example.com/webhook"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{ ...controlBase, width: "100%", minWidth: 0 }}
        />
      </label>

      {/* Headers */}
      <div style={{ display: "grid", gap: 8, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600 }}>Headers (optional)</div>
        <div style={{ display: "grid", gap: 8, minWidth: 0 }}>
          {headers.map((h, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr) auto",
                gap: 8,
                minWidth: 0, // let the row shrink
              }}
            >
              <input
                value={h.key}
                onChange={(e) => updateHeader(i, { key: e.target.value })}
                placeholder="Header name (e.g. Authorization)"
                style={{ ...controlBase, minWidth: 0 }}
              />
              <input
                value={h.value}
                onChange={(e) => updateHeader(i, { value: e.target.value })}
                placeholder="Header value"
                style={{ ...controlBase, minWidth: 0 }}
              />
              <button
                type="button"
                onClick={() => removeHeader(i)}
                style={{
                  ...controlBase,
                  whiteSpace: "nowrap",
                  alignSelf: "stretch",
                }}
                aria-label="Remove header"
                title="Remove header"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div>
          <button type="button" onClick={addHeader} style={controlBase}>
            Add header
          </button>
        </div>
      </div>

      {/* Timeout */}
      <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600 }}>Timeout (ms)</div>
        <input
          type="number"
          min={0}
          step={100}
          value={timeoutMs}
          onChange={(e) => setTimeoutMs(parseInt(e.target.value, 10))}
          style={{ ...controlBase, width: 160, minWidth: 0 }}
        />
      </label>
    </div>
  );
}
