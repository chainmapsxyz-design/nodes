// nodes/webhook/meta.js
export const meta = {
    label: "Webhook",
    version: "1.0.0",
    description:
        "Sends the (single) upstream value as a JSON payload to a configured URL. Optional headers. Supports GET, POST, PUT, PATCH, DELETE.",
    keywords: ["http", "request", "post", "webhook", "fetch"],
    type: "events.webhook",
    category: "Events",
    icon: "📡",
    blockchains: ["all"],

    // IMPORTANT: single input only
    inputs: [
        {
            key: "in",
            label: "JSON",
            type: ["object", "array", "string", "number", "boolean", "null", "any"],
            // Custom hints your canvas/engine can honor:
            maxConnections: 1,
            cardinality: "one",
        },
    ],

    // Optionally surface response data to downstream nodes
    outputs: [
        { key: "response", label: "Response", type: ["object", "string", "null"] },
        { key: "status", label: "Status", type: "number" },
        { key: "ok", label: "OK", type: "boolean" },
    ],

    // Inspector schema (for reference; the actual UI is in inspector.jsx)
    config: [
        {
            key: "method",
            label: "Method",
            type: "enum",
            options: ["POST", "GET", "PUT", "PATCH", "DELETE"],
            default: "POST",
        },
        { key: "url", label: "URL", type: "string", default: "" },
        {
            key: "headers",
            label: "Headers",
            type: "kv[]", // key/value rows
            default: [{ key: "Content-Type", value: "application/json" }],
        },
        { key: "timeoutMs", label: "Timeout (ms)", type: "number", default: 10000 },
    ],

    getInitialData: () => ({
        method: "POST",
        url: "",
        headers: [{ key: "Content-Type", value: "application/json" }],
        timeoutMs: 10000,
    }),

    isDeterministic: false, // network / remote side-effects
    hasSideEffects: true,
};
