// nodes/core/Constant/process.js

/**
 * Runtime for "core.constant".
 * 
 * Contract:
 * - No inputs.
 * - Reads node.data.value.
 * - Returns an object whose keys match meta.outputs[*].key.
 * - Pure, no side effects.
 *
 * @param {object} ctx   - runtime context ({ logger?, fetch? } etc.)
 * @param {object} node  - graph node ({ id, type, data })
 * @param {object} inputs- merged upstream outputs (unused here)
 * @param {object} event - original trigger event (unused here)
 * @returns {Promise<{value: any}>}
 */
export async function run(_ctx, node, _inputs, _event) {
    const v = node?.data?.value ?? null;

    // Shallow-clone objects/arrays to avoid passing mutable references downstream
    const safe =
        v && typeof v === "object"
            ? (Array.isArray(v) ? v.slice() : { ...v })
            : v;

    return { value: safe };
}
