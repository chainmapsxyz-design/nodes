// nodes/core/Constant/registerRuntime.js
import { run } from "./process.js";
import { meta } from "./meta.js";

/**
 * Register this node with the runtime handlers.
 * Safe for the worker: no JSX imports.
 *
 * @param {{ handlers: Map<string, {run:Function}> }} registries
 */
export function registerRuntime({ handlers }) {
    if (!meta?.type || typeof run !== "function") return;
    handlers.set(meta.type, { run });
}
