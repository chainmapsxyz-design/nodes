// src/nodes/core/Formatter/inspector.jsx
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Inspector for "core.formatter"
 * Edits node.data.mode ("json" | "string") and node.data.template (string).
 * Also renders a searchable list of available parameters discovered from connected inputs.
 *
 * Expected data shape in `value` or `node.data`:
 * {
 *   mode: "json" | "string",
 *   template: string,
 *   availableParams?: Array<{
 *     name: string,        // e.g. "offer:amount" or "value"
 *     type?: string,       // e.g. "uint256", "string"
 *     src?: string,        // e.g. "ethereum.listener" | "core.constant"
 *     preview?: any,       // optional small preview of the value
 *     nodeId?: string      // optional for disambiguation
 *   }>
 * }
 */
export default function FormatterInspector({ node, value, onChange }) {
    const mode = value?.mode === "string" ? "string" : "json";
    const template = typeof value?.template === "string" ? value.template : (mode === "json" ? "{\n  \n}" : "");
    const paramsFromData = value?.availableParams || node?.data?.availableParams || [];

    const [localMode, setLocalMode] = useState(mode);
    const [text, setText] = useState(template);
    const [query, setQuery] = useState("");

    const textAreaRef = useRef(null);

    // keep in sync if node changes externally
    useEffect(() => {
        setLocalMode(mode);
    }, [mode, node?.id]);

    useEffect(() => {
        setText(template);
    }, [template, node?.id]);

    // Build tokens and handle duplicates deterministically.
    // Token format: {{src.name}}; if duplicates, append [2], [3], ...
    const tokenizedParams = useMemo(() => {
        const baseCounts = new Map();
        return paramsFromData.map((p) => {
            const src = p?.src || "unknown";
            const name = p?.name || "value";
            const base = `${src}.${name}`;

            const seen = (baseCounts.get(base) || 0) + 1;
            baseCounts.set(base, seen);

            const suffix = seen > 1 ? `[${seen}]` : "";
            const token = `{{${base}${suffix}}}`;

            return {
                name,
                type: p?.type || "any",
                src,
                token,
                preview: p?.preview,
                nodeId: p?.nodeId,
                ordinal: seen,
            };
        });
    }, [paramsFromData]);

    const filteredParams = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return tokenizedParams;
        return tokenizedParams.filter((p) => {
            const bag = `${p.name} ${p.type} ${p.src} ${p.token}`.toLowerCase();
            return bag.includes(q);
        });
    }, [tokenizedParams, query]);

    const valid = localMode === "string" ? true : validateJsonTemplate(text);

    function push(next) {
        onChange?.({ ...(value || {}), ...next });
    }

    function onModeSwitch(nextMode) {
        setLocalMode(nextMode);
        if (nextMode === "json" && !looksLikeObjectOrArray(text)) {
            const seed = "{\n  \n}";
            setText(seed);
            push({ mode: nextMode, template: seed });
        } else {
            push({ mode: nextMode, template: text });
        }
    }

    function onTextChange(t) {
        setText(t);
        push({ template: t });
    }

    function insertTokenAtCursor(token) {
        const el = textAreaRef.current;
        if (!el) {
            onTextChange((text || "") + token);
            return;
        }
        const start = el.selectionStart ?? (text?.length || 0);
        const end = el.selectionEnd ?? start;
        const next = (text || "").slice(0, start) + token + (text || "").slice(end);
        onTextChange(next);
        // restore cursor right after inserted token
        requestAnimationFrame(() => {
            el.focus();
            const pos = start + token.length;
            try {
                el.setSelectionRange(pos, pos);
            } catch { }
        });
    }

    return (
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ fontWeight: 800 }}>Formatter</div>

        {/* Mode switch */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onModeSwitch("json")}
            style={segButtonStyle(localMode === "json")}
            title="JSON mode"
          >
            JSON
          </button>
          <button
            onClick={() => onModeSwitch("string")}
            style={segButtonStyle(localMode === "string")}
            title="Plain text mode"
          >
            Plain Text
          </button>
        </div>

        {/* Editor */}
        <label style={{ fontSize: 12, color: "#475569" }}>
          {localMode === "json" ? "JSON Template" : "Text Template"}
        </label>
        <textarea
          ref={textAreaRef}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          spellCheck={false}
          placeholder={
            localMode === "json"
              ? '{ "offer": { "amount": {{ethereum.listener.offer:amount}} } }'
              : "Order {{ethereum.listener.orderHash}} filled by {{ethereum.listener.offerer}}"
          }
          style={{
            ...fieldStyle(),
            minHeight: 220,
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
            fontSize: 12,
          }}
        />

        {/* Status */}
        <div style={{ fontSize: 12 }}>
          <span
            style={{ color: valid ? "#16a34a" : "#dc2626", fontWeight: 600 }}
          >
            {valid ? "Valid" : "Invalid"}
          </span>{" "}
          {localMode === "json" && (
            <span style={{ color: "#64748b" }}>
              {
                "(validation: basic regex + JSON parse with {{ vars }} substitution)"
              }
            </span>
          )}
        </div>

        {/* Variables list */}
        <div style={{ display: "grid", gap: 8 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <label style={{ fontSize: 12, color: "#475569" }}>
              Variables ({tokenizedParams.length})
            </label>
          </div>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search variables…"
            style={fieldStyle()}
          />

          <div
            style={{
              display: "grid",
              gap: 6,
              maxHeight: 220,
              overflow: "auto",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: 8,
              background: "#fff",
            }}
          >
            {filteredParams.length === 0 && (
              <div style={{ fontSize: 12, color: "#94a3b8" }}>
                No variables available. Connect nodes to this formatter.
              </div>
            )}
            {filteredParams.map((p, idx) => (
              <button
                key={`${p.src}|${p.name}|${p.ordinal}|${p.nodeId || idx}`}
                onClick={() => insertTokenAtCursor(p.token)}
                title={`Insert ${p.token}`}
                style={paramRowStyle()}
              >
                <div style={{ display: "grid", gap: 2, textAlign: "left" }}>
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                    <TypePill type={p.type} />
                    {p.ordinal > 1 && (
                      <span
                        style={{
                          fontSize: 10,
                          lineHeight: 1,
                          padding: "2px 6px",
                          borderRadius: 6,
                          border: "1px solid #e2e8f0",
                          background: "#f8fafc",
                          color: "#475569",
                        }}
                        title="Duplicate name; use the bracketed index to disambiguate"
                      >
                        #{p.ordinal}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>
                    src: <code>{p.src}</code> · token: <code>{p.token}</code>
                  </div>
                  {typeof p.preview !== "undefined" && (
                    <div style={{ fontSize: 11, color: "#0f172a" }}>
                      val: <Preview value={p.preview} />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
}

function segButtonStyle(active) {
    return {
        padding: "6px 10px",
        borderRadius: 8,
        border: "1px solid " + (active ? "#0ea5e9" : "#cbd5e1"),
        background: active ? "#e0f2fe" : "#fff",
        cursor: "pointer",
        fontWeight: active ? 700 : 500,
        fontSize: 12,
    };
}

function fieldStyle() {
    return {
        padding: "8px 10px",
        borderRadius: 8,
        border: "1px solid #cbd5e1",
        background: "#fff",
    };
}

function paramRowStyle() {
    return {
        padding: 8,
        borderRadius: 8,
        border: "1px solid #e2e8f0",
        background: "#f8fafc",
        cursor: "pointer",
    };
}

function TypePill({ type }) {
    return (
        <span
            style={{
                fontSize: 10,
                lineHeight: 1,
                padding: "2px 6px",
                borderRadius: 6,
                border: "1px solid #e2e8f0",
                color: "#475569",
                background: "#f8fafc",
            }}
        >
            {type || "any"}
        </span>
    );
}

function Preview({ value }) {
    try {
        if (value === null) return <code>null</code>;
        const t = typeof value;
        if (t === "string" || t === "number" || t === "boolean") return <code>{String(value)}</code>;
        return <code>{JSON.stringify(value)}</code>;
    } catch {
        return <code>[unrenderable]</code>;
    }
}

// --- Validation helpers ---
// Cheap guard: must start/end with object/array tokens.
function looksLikeObjectOrArray(s = "") {
    const trimmed = s.trim();
    return /^(?:\{[\s\S]*\}|\[[\s\S]*\])$/.test(trimmed);
}

// Replace all {{...}} tokens with a JSON-safe placeholder and attempt JSON.parse.
// This allows tokens either inside quotes or bare (numbers, booleans, null).
function validateJsonTemplate(s = "") {
    if (!looksLikeObjectOrArray(s)) return false;
    try {
        const substituted = s.replace(/\{\{[^}]+\}\}/g, "0"); // safe placeholder
        JSON.parse(substituted);
        return true;
    } catch {
        return false;
    }
}
