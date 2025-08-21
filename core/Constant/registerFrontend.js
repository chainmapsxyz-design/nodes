// nodes/core/Constant/registerFrontend.js
import { meta } from "./meta.js";
import UI from "./ui.jsx";
import Inspector from "./inspector.jsx";

/**
 * Register this node with the frontend registries.
 * Browser/Vite only; imports JSX.
 *
 * @param {{
 *   nodeTypes: Record<string, any>,
 *   inspectorRegistry: Record<string, any>,
 *   nodePalette: Array<any>,
 *   metaRegistry?: Map<string, any>
 * }} registries
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
