export const meta = {
    // Identity & catalog
    label: "Ethereum Event",
    version: "1.0.0",
    description: "Listen to a contract’s event and emit its arguments.",
    keywords: ["ethereum", "event", "listener", "abi", "logs"],
    type: "ethereum.listener",
    category: "Events",
    subcategory: "",
    icon: "⚡️",
    color: "default",
    colorAlt: "default",
    blockchains: ["ethereum"],

    // I/O (runtime may add dynamic per-arg outputs; base contract is a single event object)
    inputs: [],
    outputs: [
        { key: "event", label: "Event (filtered)", type: "object" }
    ],

    // Inspector schema (node.data)
    config: [
        { key: "address", label: "Address", type: "string", required: true, default: "" },
        // fetched list: [{ name, inputs: [{ name, type, indexed, internalType, components? }] }]
        { key: "events", label: "Events", type: "json", required: false, default: [] },
        { key: "eventName", label: "Event Name", type: "string", required: false, default: "" },
        // argsRaw: inputs of the selected event (as-is from ABI)
        { key: "argsRaw", label: "Args (raw)", type: "json", required: false, default: [] },
        // argsFlat: recursively flattened; names like "consideration:itemType"
        // each item is { name, type, indexed?, internalType?, sourcePath?: string[] }
        { key: "argsFlat", label: "Args (flat)", type: "json", required: false, default: [] },
        // map of flat argName -> boolean (visible in node & included in payload)
        { key: "argVisibility", label: "Arg Visibility", type: "json", required: false, default: {} },
        { key: "allValues", label: "All values", type: "boolean", required: false, default: false },
    ],

    // Defaults for new node instances
    getInitialData: () => ({
        address: "",
        events: [],
        eventName: "",
        argsRaw: [],
        argsFlat: [],
        argVisibility: {},
        allValues: false
    }),

    // Runtime hints
    isDeterministic: false, // depends on chain events
    hasSideEffects: false   // listening only; no external writes
};
