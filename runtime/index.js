// nodes/runtime/index.js
import { registerCoreRuntime } from "../core/registerRuntime.js";
import { registerEventsRuntime } from "../events/registerRuntime.js";

/** Map<nodeType, { run: (ctx, node, inputs, event) => Promise<object> }> */
export const handlers = new Map();

// Register all categories once
registerCoreRuntime({ handlers });
registerEventsRuntime({ handlers });

/** Lookup handler by node type (e.g., "core.constant") */
export function getHandler(type) {
    return handlers.get(type);
}

/** Allow host app to register private/closed-source nodes at boot */
export function register({ type, run }) {
    if (!type || typeof run !== "function") {
        throw new Error("Invalid handler: expected { type: string, run: function }");
    }
    handlers.set(type, { run });
}
