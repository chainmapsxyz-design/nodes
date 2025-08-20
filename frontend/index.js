// nodes/frontend/index.js
import { registerCoreFrontend } from "../core/index.js";
import { registerEventsFrontend } from "../events/index.js";

const nodeTypes = {};
const inspectorRegistry = {};
const nodePalette = [];

// Register all nodes in the "core" category
registerCoreFrontend({ nodeTypes, inspectorRegistry, nodePalette });
registerEventsFrontend({ nodeTypes, inspectorRegistry, nodePalette });

// If you later add categories, import/register them here:
// import { registerMessagingFrontend } from "../messaging/index.js";
// registerMessagingFrontend({ nodeTypes, inspectorRegistry, nodePalette });

export { nodeTypes, inspectorRegistry, nodePalette };