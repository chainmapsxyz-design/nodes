// src/nodes/core/Formatter/meta.js
export const meta = {
    // Identity & catalog
    label: "Formatter",
    version: "1.0.0",
    description:
        "Formats connected inputs into a single JSON object or string using {{mustache}}-style variables.",
    keywords: ["template", "json", "string", "format", "payload", "mustache"],
    type: "core.formatter",
    category: "Core",
    subcategory: "",
    icon: "🧩",
    color: "default",
    colorAlt: "default",
    blockchains: ["all"],

    // I/O
    // Accept any inputs; engine will merge upstream outputs.
    inputs: [{ key: "in", label: "Inputs", type: "any" }],
    outputs: [
        { key: "value", label: "Value", type: ["string", "object"] }
    ],

    // Inspector schema
    config: [
        { key: "mode", label: "Mode", type: "enum", options: ["json", "string"], default: "json" },
        { key: "template", label: "Template", type: "string", default: "{\n  \n}" }
    ],
    inspector: [
        { key: "mode", label: "Mode", type: "enum", options: ["json", "string"], default: "json" },
        { key: "template", label: "Template", type: "string", default: "{\n  \n}" }
    ],

    // Defaults for new node instances
    getInitialData: () => ({
        mode: "json",
        template: "{\n  \n}",
        // availableParams: [{ name, type, src, preview?, nodeId? }, ...]
    }),

    // Runtime hints
    isDeterministic: true,
    hasSideEffects: false,
};
