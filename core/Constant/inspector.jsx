// nodes/core/Constant/inspector.jsx
import { useEffect, useMemo, useState } from "react";

/**
 * Inspector for "core.constant"
 * Edits node.data.value. Supports string, number, boolean, null, and JSON.
 *
 * Props:
 * - node: { id, type, data }
 * - value: node.data (object)
 * - onChange: (nextData) => void
 */
export default function ConstantInspector({ node, value, onChange }) {
  const current = value?.value ?? null;

  const initialKind = useMemo(() => detectKind(current), [node?.id]);
  const [kind, setKind] = useState(initialKind);

  // Editors' local state
  const [str, setStr] = useState(
    kind === "string" ? String(current ?? "") : ""
  );
  const [numText, setNumText] = useState(
    kind === "number" ? String(current) : ""
  );
  const [boolVal, setBoolVal] = useState(
    kind === "boolean" ? Boolean(current) : false
  );
  const [jsonText, setJsonText] = useState(
    kind === "json" ? safeJSONStringify(current, 2) : "{\n  \n}"
  );
  const [jsonErr, setJsonErr] = useState("");

  // Sync when external value changes (selecting a different node or external edits)
  useEffect(() => {
    const k = detectKind(current);
    setKind(k);
    if (k === "string") setStr(String(current ?? ""));
    else if (k === "number") setNumText(String(current));
    else if (k === "boolean") setBoolVal(Boolean(current));
    else if (k === "json") setJsonText(safeJSONStringify(current, 2));
  }, [current]);

  function push(nextVal) {
    onChange?.({ ...(value || {}), value: nextVal });
  }

  function applyJson() {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonErr("");
      push(parsed);
    } catch (e) {
      setJsonErr("Invalid JSON");
    }
  }

  function onKindChange(nextKind) {
    setKind(nextKind);
    // Initialize editor state and push a sensible default
    switch (nextKind) {
      case "string":
        setStr("");
        push("");
        break;
      case "number":
        setNumText("0");
        push(0);
        break;
      case "boolean":
        setBoolVal(false);
        push(false);
        break;
      case "null":
        push(null);
        break;
      case "json":
        const seed = "{\n  \n}";
        setJsonText(seed);
        setJsonErr("");
        // Don't push immediately; wait for Apply to avoid accidental {} writes
        break;
      default:
        break;
    }
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ fontWeight: 800 }}>Constant</div>

      <label style={{ fontSize: 12, color: "#475569" }}>Value Type</label>
      <select
        value={kind}
        onChange={(e) => onKindChange(e.target.value)}
        style={fieldStyle()}
      >
        <option value="string">string</option>
        <option value="number">number</option>
        <option value="boolean">boolean</option>
        <option value="null">null</option>
        <option value="json">json (object/array)</option>
      </select>

      {kind === "string" && (
        <>
          <label style={{ fontSize: 12, color: "#475569" }}>Value</label>
          <input
            value={str}
            onChange={(e) => {
              const v = e.target.value;
              setStr(v);
              push(v);
            }}
            style={fieldStyle()}
            placeholder="e.g. hello world"
          />
        </>
      )}

      {kind === "number" && (
        <>
          <label style={{ fontSize: 12, color: "#475569" }}>Value</label>
          <input
            type="number"
            value={numText}
            onChange={(e) => {
              const t = e.target.value;
              setNumText(t);
              const n = Number(t);
              if (!Number.isNaN(n)) push(n);
            }}
            style={fieldStyle()}
            placeholder="e.g. 42"
          />
        </>
      )}

      {kind === "boolean" && (
        <>
          <label style={{ fontSize: 12, color: "#475569" }}>Value</label>
          <select
            value={boolVal ? "true" : "false"}
            onChange={(e) => {
              const v = e.target.value === "true";
              setBoolVal(v);
              push(v);
            }}
            style={fieldStyle()}
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        </>
      )}

      {kind === "null" && (
        <div
          style={{
            fontSize: 12,
            color: "#94a3b8",
            paddingTop: 4,
            paddingBottom: 8,
          }}
        >
          Value will output <code>null</code>.
        </div>
      )}

      {kind === "json" && (
        <>
          <label style={{ fontSize: 12, color: "#475569" }}>JSON</label>
          <textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              if (jsonErr) setJsonErr("");
            }}
            spellCheck={false}
            style={{
              ...fieldStyle(),
              minHeight: 200,
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
              fontSize: 12,
            }}
            placeholder='e.g. { "foo": 1 }'
          />
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={applyJson} style={buttonStyle()}>
              Apply JSON
            </button>
          </div>
          {jsonErr && (
            <div style={{ color: "#dc2626", fontSize: 12 }}>{jsonErr}</div>
          )}
        </>
      )}
    </div>
  );
}

function detectKind(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return "json";
  const t = typeof v;
  if (t === "string") return "string";
  if (t === "number") return "number";
  if (t === "boolean") return "boolean";
  if (t === "object") return "json";
  return "string";
}

function safeJSONStringify(v, space = 2) {
  try {
    return JSON.stringify(v ?? {}, null, space);
  } catch {
    return "{\n  \n}";
  }
}

function fieldStyle() {
  return {
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    background: "#fff",
  };
}

function buttonStyle() {
  return {
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    background: "#fff",
    cursor: "pointer",
  };
}
