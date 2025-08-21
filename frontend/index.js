// nodes/frontend/index.js
import { registerCoreFrontend } from "../core/registerFrontend.js";
import { registerEventsFrontend } from "../events/registerFrontend.js";

const nodeTypes = {};
const inspectorRegistry = {};
const nodePalette = [];

// NEW: meta registry and getter so canvas / limits can read node meta
const metaRegistry = new Map();
function getNodeMeta(type) {
    return metaRegistry.get(type) || null;
}

// Register all nodes in the "core" category
registerCoreFrontend({ nodeTypes, inspectorRegistry, nodePalette, metaRegistry });

// Register all nodes in the "events" category
registerEventsFrontend({ nodeTypes, inspectorRegistry, nodePalette, metaRegistry });

// If you later add categories, import/register them here:
// import { registerMessagingFrontend } from "../messaging/index.js";
// registerMessagingFrontend({ nodeTypes, inspectorRegistry, nodePalette, metaRegistry });

export { nodeTypes, inspectorRegistry, nodePalette, getNodeMeta };
