// /nodes/ethereum/EthereumListener/process.js

/**
 * Runtime for "ethereum.listener"
 *
 * Contract:
 *   run(ctx, node, inputs, event) -> outputs
 *
 * Inputs:
 *   - ctx: { logger, fetch }
 *   - node: { id, type, data }
 *   - inputs: upstream outputs merged (unused for a source-style node)
 *   - event: the stored EventLog payload or a wrapper containing it
 *
 * Node data (from inspector):
 *   - argsFlat: [{ name, type, sourcePath: string[], ... }]
 *   - argVisibility: { [flatName]: boolean }
 *   - allValues: boolean
 *
 * Outputs:
 *   - Default (allValues = false): { event: { [flatName]: value } }
 *   - All-values mode: { ["arg:" + flatName]: value, ... }
 *
 * Notes:
 *   - This node assumes your EventLog.payload has the event args decoded into
 *     a JSON object keyed by ABI input names. For tuple/tuple[] the structure
 *     should mirror the ABI (objects / arrays).
 *   - For tuple[] leaves, values are arrays (e.g., consideration:itemType -> uint8[]).
 */

export async function run(ctx, node, _inputs, event) {
    const log = ctx?.logger || console;
    const data = node?.data || {};

    const argsFlat = Array.isArray(data.argsFlat) ? data.argsFlat : [];
    const vis = data.argVisibility || {};
    const allValues = !!data.allValues;

    // Try to locate the actual payload: accept raw payload or common wrappers
    const payload =
        (event && (event.payload || event.data || event.args)) || event || {};

    // Build a filtered view with flattened keys
    const filtered = {};
    for (const f of argsFlat) {
        const flatName = f?.name;
        if (!flatName) continue;
        if (!vis[flatName]) continue;

        const path = Array.isArray(f?.sourcePath) && f.sourcePath.length
            ? f.sourcePath
            : flatName.split(":");

        const value = pickFlattenedValue(payload, path);
        // Keep undefined keys out; null/false/0 are valid
        if (value !== undefined) {
            filtered[flatName] = value;
        }
    }

    // Emit per mode
    if (allValues) {
        const out = {};
        for (const [k, v] of Object.entries(filtered)) {
            out[`arg:${k}`] = v;
        }

        // Optional: also include the combined event object for convenience
        // (comment out the next line if you want strict-per-arg only)
        out.event = filtered;

        return out;
    }

    // Single combined payload
    return { event: filtered };
}

/**
 * Traverse a nested event args object by path.
 * - If the current node is an array, map the rest of the path across items.
 * - Returns undefined if a segment is missing.
 *
 * Example:
 *   payload = { consideration: [{ itemType: 1, token: "0x..." }, ...] }
 *   pickFlattenedValue(payload, ["consideration", "itemType"])  -> [1, ...]
 */
function pickFlattenedValue(root, path) {
    if (!path || path.length === 0) return root;

    const [head, ...rest] = path;

    if (Array.isArray(root)) {
        // Map remaining path across each element in the array
        return root.map((el) => pickFlattenedValue(el, path));
    }

    const next = root?.[head];
    if (next === undefined) return undefined;

    if (rest.length === 0) return next;
    return pickFlattenedValue(next, rest);
}
