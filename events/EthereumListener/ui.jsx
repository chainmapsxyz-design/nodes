import { Handle, Position } from "@xyflow/react";

export default function EthereumListenerNode({ data }) {
  const address = data?.address || "";
  const eventName = data?.eventName || "";
  const argsFlat = Array.isArray(data?.argsFlat) ? data.argsFlat : [];
  const vis = data?.argVisibility || {};
  const allValues = !!data?.allValues;

  const visibleArgs = argsFlat.filter((a) => vis[a?.name || ""]);

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
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ fontWeight: 800 }}>Ethereum</div>
        <SmallPill text="Event" />
      </div>

      {/* Contract */}
      <KV label="Contract" value={abbrAddress(address)} />

      {/* Event name */}
      <KV label="Listening" value={eventName ? `(${eventName})` : "—"} />

      {/* Mode */}
      <div style={{ fontSize: 12, color: "#475569" }}>
        {allValues
          ? "Emitting: per-argument handles"
          : "Emitting: single JSON payload"}
      </div>

      {/* Output handles */}
      {!allValues ? (
        <Handle
          id="event"
          type="source"
          position={Position.Right}
          style={{ right: -8, top: "50%", transform: "translateY(-50%)" }}
          title="event"
        />
      ) : (
        <div style={{ display: "grid", gap: 6, paddingTop: 2 }}>
          {visibleArgs.length === 0 ? (
            <Muted>All values mode is on, but no visible args.</Muted>
          ) : (
            visibleArgs.map((arg, i) => {
              const name = arg?.name || `arg_${i}`;
              return (
                <div
                  key={name}
                  style={{ position: "relative", paddingRight: 10 }}
                >
                  <ArgBadge
                    name={name}
                    typeText={arg?.type || arg?.internalType || ""}
                  />
                  <Handle
                    id={`arg:${name}`}
                    type="source"
                    position={Position.Right}
                    style={{ right: -8, top: "50%" }}
                    title={name}
                  />
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function SmallPill({ text }) {
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
      {text}
    </span>
  );
}

function KV({ label, value }) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <div style={{ fontSize: 11, color: "#64748b" }}>{label}</div>
      <div
        style={{
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
          fontSize: 12,
          color: "#111827",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          padding: "6px 8px",
        }}
        title={String(value || "")}
      >
        {String(value || "")}
      </div>
    </div>
  );
}

function ArgBadge({ name, typeText }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          fontSize: 11,
          lineHeight: 1,
          padding: "4px 6px",
          borderRadius: 6,
          border: "1px solid #e2e8f0",
          background: "#f8fafc",
          color: "#334155",
          maxWidth: 180,
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }}
        title={name}
      >
        {name}
      </span>
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
        title={typeText}
      >
        {typeText || "type"}
      </span>
    </div>
  );
}

function Muted({ children }) {
  return <div style={{ fontSize: 12, color: "#94a3b8" }}>{children}</div>;
}

function abbrAddress(addr) {
  if (!addr || typeof addr !== "string") return "—";
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
