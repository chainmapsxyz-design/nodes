// nodes/frontend/index.js
// Auto-register all nodes via Vite's import.meta.glob (build-time).
// Expects per-node files: meta.js (named export `meta`), ui.jsx (default), inspector.jsx (default, optional).

const metaMods = import.meta.glob("../**/meta.js", { eager: true });
const uiMods = import.meta.glob("../**/ui.jsx", { eager: true });
const inspMods = import.meta.glob("../**/inspector.jsx", { eager: true });

function dirKey(p) {
    return p.replace(/^\.\.\//, "").replace(/\/(meta\.js|ui\.jsx|inspector\.jsx)$/, "");
}

const byDir = new Map();

// collect meta
for (const [p, mod] of Object.entries(metaMods)) {
    const k = dirKey(p);
    const meta = mod?.meta;
    if (meta && meta.type) byDir.set(k, { meta });
}

// collect UI
for (const [p, mod] of Object.entries(uiMods)) {
    const k = dirKey(p);
    const item = byDir.get(k) || {};
    item.UI = mod?.default;
    byDir.set(k, item);
}

// collect Inspector (optional)
for (const [p, mod] of Object.entries(inspMods)) {
    const k = dirKey(p);
    const item = byDir.get(k) || {};
    item.Inspector = mod?.default;
    byDir.set(k, item);
}

// Build exports
export const nodeTypes = {};
export const inspectorRegistry = {};
export const nodePalette = [];

for (const { meta, UI, Inspector } of byDir.values()) {
    if (!meta?.type || !UI) continue;

    nodeTypes[meta.type] = UI;
    if (Inspector) inspectorRegistry[meta.type] = Inspector;

    nodePalette.push(toPaletteItem(meta));
}

function toPaletteItem(m) {
    return {
        type: m.type,
        label: m.label,
        icon: m.icon || "🧩",
        getData: m.getInitialData || (() => ({})),
        enabled: m.enabled || (() => true),
        category: m.category || "General",
        subcategory: m.subcategory || "",
        description: m.description || "",
        keywords: m.keywords || [],
        color: m.color || "default",
        colorAlt: m.colorAlt || "default",
    };
}
