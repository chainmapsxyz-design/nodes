import { useEffect, useMemo, useState } from "react";
import useAuthedFetch from "@app/auth/useAuthedFetch";
import { useEthereumApi } from "@app/hooks/useEthereumApi";

/**
 * Inspector for "ethereum.listener"
 *
 * Props:
 * - node: { id, type, data }
 * - value: node.data (object)
 * - onChange: (patch) => void  — pushes node.data updates
 */
export default function EthereumListenerInspector({ node, value, onChange }) {
  const authedFetch = useAuthedFetch();
  const ethereumApi = useEthereumApi(authedFetch);

  const address = value?.address ?? "";
  const networkKey = value?.networkKey ?? "ethereum-mainnet";
  const events = value?.events ?? [];
  const eventName = value?.eventName ?? "";
  const eventAbi = value?.eventAbi ?? null;
  const argsRaw = value?.argsRaw ?? [];
  const argsFlat = value?.argsFlat ?? [];
  const argVisibility = value?.argVisibility ?? {};
  const allValues = !!value?.allValues;

  const [addrInput, setAddrInput] = useState(address);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => setAddrInput(address ?? ""), [address]);

  const selectedEvent = useMemo(
    () => (events || []).find((e) => e.name === eventName) || null,
    [events, eventName]
  );

  async function fetchEvents(addr) {
    setErr("");
    const trimmed = (addr || "").trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
      setErr("Enter a valid 0x…40 hex address");
      return;
    }

    setLoading(true);
    try {
      const json = await ethereumApi.getAbi(trimmed);
      const evts = Array.isArray(json?.events) ? json.events : [];
      onChange?.({
        address: trimmed,
        events: evts,
        eventName: "",
        eventAbi: null,
        argsRaw: [],
        argsFlat: [],
        argVisibility: {},
      });
    } catch (e) {
      setErr(e?.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  }

  function onSelectEvent(name) {
    const evt = (events || []).find((e) => e.name === name) || null;
    const inputs = Array.isArray(evt?.inputs) ? evt.inputs : [];
    const flat = flattenArgs(inputs);
    const vis = {};
    for (const f of flat) vis[f.name] = true;

    onChange?.({
      eventName: name || "",
      // canonical fragment for backend
      eventAbi: evt ? { type: "event", name: evt.name, inputs } : null,
      argsRaw: inputs,
      argsFlat: flat,
      argVisibility: vis,
    });
  }

  function onSelectNetwork(nextKey) {
    onChange?.({ networkKey: nextKey || "ethereum-mainnet" });
  }

  function toggleArgVisibility(argName) {
    const next = { ...(argVisibility || {}) };
    next[argName] = !next[argName];
    onChange?.({ argVisibility: next });
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Section title="Contract">
        <label style={labelStyle}>Address</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={addrInput}
            onChange={(e) => setAddrInput(e.target.value)}
            placeholder="0x…"
            spellCheck={false}
            style={
              loading
                ? { ...inputStyle, opacity: 0.6, cursor: "not-allowed" }
                : inputStyle
            }
            disabled={loading}
          />
          <button
            type="button"
            disabled={loading}
            onClick={() => fetchEvents(addrInput)}
            style={buttonStyle(loading)}
            title="Fetch events from ABI"
          >
            {loading ? "Loading…" : "Load"}
          </button>
        </div>
        {err ? <div style={errorStyle}>{err}</div> : null}
      </Section>

      <Section title="Network">
        <label style={labelStyle}>Select network</label>
        <select
          value={networkKey}
          onChange={(e) => onSelectNetwork(e.target.value)}
          style={selectStyle}
        >
          {NETWORK_OPTIONS.map((n) => (
            <option key={n.key} value={n.key}>
              {n.label}
            </option>
          ))}
        </select>
      </Section>

      <Section title="Event">
        <label style={labelStyle}>Select event</label>
        <select
          value={eventName}
          onChange={(e) => onSelectEvent(e.target.value)}
          disabled={!events.length || loading}
          style={selectStyle}
        >
          <option value="" disabled>
            {events.length ? "Choose…" : "Load contract first"}
          </option>
          {events.map((e) => (
            <option key={e.name} value={e.name}>
              {e.name}
            </option>
          ))}
        </select>

        <label style={{ ...labelStyle, marginTop: 8 }}>
          <input
            type="checkbox"
            checked={allValues}
            onChange={(e) => onChange?.({ allValues: e.target.checked })}
            style={{ marginRight: 8 }}
          />
          All values (one handle per arg)
        </label>
      </Section>

      <Section title="Arguments">
        {!eventName ? (
          <Empty>Choose an event to see its arguments.</Empty>
        ) : !argsFlat.length ? (
          <Empty>No arguments on this event.</Empty>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {argsFlat.map((arg) => {
              const name = arg?.name || "(unnamed)";
              const t = formatSolType(arg);
              const visible = !!argVisibility[name];
              return (
                <div
                  key={name + ":" + t}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    padding: "6px 8px",
                    background: visible ? "white" : "#f8fafc",
                  }}
                >
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <ArgPill name={name} />
                    <TypePill type={t} />
                    {arg?.indexed ? <IndexedTag /> : null}
                  </div>
                  <button
                    onClick={() => toggleArgVisibility(name)}
                    title={
                      visible
                        ? "Hide from node/payload"
                        : "Show in node/payload"
                    }
                    style={iconButtonStyle}
                  >
                    {visible ? EyeIcon : EyeOffIcon}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}

const NETWORK_OPTIONS = [
  { key: "ethereum-mainnet", label: "Ethereum Mainnet" },
  { key: "ethereum-sepolia", label: "Ethereum Sepolia" },
];

// ——— helpers ———
function flattenArgs(args, prefix = "", parentWasArray = false) {
  const out = [];
  for (const arg of args || []) {
    const baseName = arg?.name || "(unnamed)";
    const fullName = prefix ? `${prefix}:${baseName}` : baseName;

    const isTuple = arg?.type === "tuple" || arg?.type?.startsWith("tuple");
    const isArray = arg?.type?.endsWith("[]");

    if (isTuple) {
      const comps = Array.isArray(arg?.components) ? arg.components : [];
      out.push(...flattenArgs(comps, fullName, parentWasArray || isArray));
      continue;
    }

    const leafType = arg?.type || arg?.internalType || "unknown";
    const displayType =
      parentWasArray && !leafType.endsWith("[]") ? `${leafType}[]` : leafType;

    out.push({
      ...arg,
      name: fullName,
      type: displayType,
      sourcePath: (prefix ? prefix.split(":") : []).concat(baseName),
    });
  }
  return out;
}

function formatSolType(arg) {
  if (!arg) return "unknown";
  return arg.type || arg.internalType || "unknown";
}

// ——— UI bits ———
function Section({ title, children }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ fontWeight: 700, color: "#111827" }}>{title}</div>
      {children}
    </div>
  );
}
function Empty({ children }) {
  return (
    <div style={{ fontSize: 12, color: "#6b7280", padding: "6px 4px" }}>
      {children}
    </div>
  );
}
function ArgPill({ name }) {
  return (
    <span
      style={{
        fontSize: 11,
        lineHeight: 1,
        padding: "4px 6px",
        borderRadius: 6,
        border: "1px solid #e2e8f0",
        background: "#f8fafc",
        color: "#334155",
        maxWidth: 220,
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
      title={name}
    >
      {name}
    </span>
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
      title={type}
    >
      {type}
    </span>
  );
}
function IndexedTag() {
  return (
    <span
      style={{
        fontSize: 10,
        lineHeight: 1,
        padding: "3px 6px",
        borderRadius: 6,
        color: "#1f2937",
        background: "#e5e7eb",
      }}
      title="indexed"
    >
      indexed
    </span>
  );
}

const labelStyle = { fontSize: 12, color: "#374151", fontWeight: 600 };
const inputStyle = {
  flex: 1,
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  fontFamily:
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
  fontSize: 12,
};
const selectStyle = { ...inputStyle, paddingRight: 28 };
const errorStyle = { color: "#b91c1c", fontSize: 12 };
const buttonStyle = (loading) => ({
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  background: loading ? "#f3f4f6" : "white",
  cursor: loading ? "not-allowed" : "pointer",
  opacity: loading ? 0.6 : 1,
});
const iconButtonStyle = {
  border: "1px solid #e5e7eb",
  background: "white",
  borderRadius: 8,
  padding: 6,
  cursor: "pointer",
};

const EyeIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
      stroke="#334155"
      strokeWidth="1.5"
    />
    <circle cx="12" cy="12" r="3" stroke="#334155" strokeWidth="1.5" />
  </svg>
);
const EyeOffIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M3 3l18 18" stroke="#334155" strokeWidth="1.5" />
    <path
      d="M10.58 10.58A3 3 0 0012 15a3 3 0 003-3 3 3 0 00-4.42-2.42"
      stroke="#334155"
      strokeWidth="1.5"
    />
    <path
      d="M9.88 5.1A10.1 10.1 0 0112 5c6.5 0 10 6 10 6a18.7 18.7 0 01-4.12 4.77M6.18 7.18A18.6 18.6 0 002 11s3.5 6 10 6c1.08 0 2.1-.16 3.06-.45"
      stroke="#334155"
      strokeWidth="1.5"
    />
  </svg>
);
