// nodes/events/EthereumListener/index.js
import { run } from "./process.js";
import { meta } from "./meta.js";
import UI from "./ui.jsx";
import Inspector from "./inspector.jsx";

/**
 * Register this node with the frontend registries.
 * Caller passes shared registries; we mutate them.
 */
export function registerFrontend({ nodeTypes, inspectorRegistry, nodePalette, metaRegistry }) {
    nodeTypes[meta.type] = UI;
    if (Inspector) inspectorRegistry[meta.type] = Inspector;

    nodePalette.push({
        type: meta.type,
        label: meta.label,
        icon: meta.icon || "🧩",
        getData: meta.getInitialData || (() => ({})),
        enabled: meta.enabled || (() => true),
        category: meta.category || "General",
        subcategory: meta.subcategory || "",
        description: meta.description || "",
        keywords: meta.keywords || [],
        color: meta.color || "default",
        colorAlt: meta.colorAlt || "default",
    });

    if (metaRegistry) metaRegistry.set(meta.type, meta);
}

/** * Register this node with the runtime handlers.
 * 
 */
export function registerRuntime({ handlers }) {
    if (!meta?.type || typeof run !== "function") return;
    handlers.set(meta.type, { run });
}