// src/nodes/core/Formatter/process.js

/**
 * Formatter process handler
 *
 * Contract:
 *   inputs: merged upstream values keyed by source handle id
 *           (e.g., { value: 123, amount: 5, json: {...}, event: {...} })
 *   node.data: {
 *     mode: "json" | "string",
 *     template: string,
 *     // optional: availableParams from inspector wiring
 *     // availableParams: [{ name, type, src, nodeId, preview }, ...]
 *   }
 *   ctx: { logger?, incomingValues?, fetchImpl?, abortSignal? }
 *
 * Returns:
 *   { value } where value is string (mode="string") or object (mode="json", or null on invalid)
 */

function isObject(v) {
    return v !== null && typeof v === "object";
}

/**
 * Walk a deep path against inputs, supporting:
 *   - dot segments: a.b.c
 *   - numeric array indices: a.0.b
 * Root key may include colons (e.g., "arg:offer:token") and is treated as a whole.
 */
function deepGetFromInputs(path, inputs) {
    if (!path || typeof path !== "string") return undefined;

    // Split first segment as the root token; keep colons in root intact.
    const dot = path.indexOf(".");
    const root = dot === -1 ? path : path.slice(0, dot);
    const rest = dot === -1 ? "" : path.slice(dot + 1);

    let cur = inputs[root];
    if (typeof cur === "undefined") return undefined;
    if (!rest) return cur;

    const parts = rest.split(".");
    for (const part of parts) {
        if (Array.isArray(cur)) {
            const idx = Number(part);
            if (!Number.isInteger(idx) || idx < 0 || idx >= cur.length) return undefined;
            cur = cur[idx];
            continue;
        }
        if (cur !== null && typeof cur === "object") {
            cur = cur[part];
            if (typeof cur === "undefined") return undefined;
            continue;
        }
        return undefined;
    }
    return cur;
}

/**
 * Build a lookup map for tokens using available hints.
 */
function buildVarMaps({ inputs = {}, data = {}, context = {} }) {
    const bySimple = new Map();
    const byQualified = new Map();
    const byIndexed = new Map();

    // 1) Simple names from inputs (direct handle ids)
    for (const [k, v] of Object.entries(inputs)) bySimple.set(k, v);

    // 2) Use availableParams to provide qualified and indexed keys
    const params = Array.isArray(data.availableParams) ? data.availableParams : [];
    const counts = new Map(); // count occurrences per "src.name"
    const incomingValues = Array.isArray(context.incomingValues)
        ? context.incomingValues
        : null;

    params.forEach((p, idx) => {
        const src = p?.src || "unknown";
        const name = p?.name || "value";
        const baseKey = `${src}.${name}`;
        const count = (counts.get(baseKey) || 0) + 1;
        counts.set(baseKey, count);

        let val;
        if (incomingValues && idx < incomingValues.length) {
            val = incomingValues[idx];
        } else if (Object.prototype.hasOwnProperty.call(inputs, name)) {
            val = inputs[name];
        } else {
            val = undefined;
        }

        if (!byQualified.has(baseKey)) byQualified.set(baseKey, val);
        if (count > 1) byIndexed.set(`${baseKey}[${count}]`, val);
    });

    return { bySimple, byQualified, byIndexed };
}

/**
 * Token finder: returns [{ raw, key, start, end }]
 */
function findTokens(str = "") {
    const tokens = [];
    const re = /\{\{\s*([^}]+?)\s*\}\}/g; // {{ key }}
    let m;
    while ((m = re.exec(str))) {
        tokens.push({
            raw: m[0],
            key: m[1].trim(),
            start: m.index,
            end: m.index + m[0].length,
        });
    }
    return tokens;
}

/**
 * Resolve token key to a value using maps, then fallback to deep-path lookup against inputs.
 */
function resolveToken(key, maps, inputs) {
    // Indexed qualified (from availableParams)
    if (/\[[0-9]+\]$/.test(key)) {
        const v = maps.byIndexed.get(key);
        if (typeof v !== "undefined") return v;
    }
    // Qualified without index (from availableParams)
    if (key.includes(".")) {
        const v = maps.byQualified.get(key);
        if (typeof v !== "undefined") return v;
    }
    // Simple name
    if (maps.bySimple.has(key)) return maps.bySimple.get(key);

    // Fallback: deep path against inputs (supports dots + numeric indices),
    // while treating the root segment literally (colons allowed).
    const v = deepGetFromInputs(key, Object.fromEntries(maps.bySimple));
    if (typeof v !== "undefined") return v;

    return undefined;
}

/**
 * Replace tokens in "string" mode.
 */
function renderString(template, maps, inputs) {
    if (typeof template !== "string" || template.length === 0) return "";
    const tokens = findTokens(template);
    if (tokens.length === 0) return template;

    let out = template;
    for (const t of tokens) {
        const v = resolveToken(t.key, maps, inputs);
        const rep =
            typeof v === "string" || typeof v === "number" || typeof v === "boolean" || v === null
                ? String(v)
                : isObject(v)
                    ? JSON.stringify(v)
                    : "";
        out = out.split(t.raw).join(rep);
    }
    return out;
}

/**
 * Replace tokens in "json" mode with JSON-safe fragments.
 */
function renderJson(template, maps, inputs) {
    if (typeof template !== "string" || template.length === 0) return null;
    const tokens = findTokens(template);
    if (tokens.length === 0) {
        try {
            return JSON.parse(template);
        } catch {
            return null;
        }
    }

    const chars = Array.from(template);

    function isInsideQuotes(index) {
        let inside = false;
        let esc = false;
        for (let i = 0; i < index; i++) {
            const c = chars[i];
            if (esc) {
                esc = false;
                continue;
            }
            if (c === "\\") {
                esc = true;
                continue;
            }
            if (c === '"') inside = !inside;
        }
        return inside;
    }

    let result = template;
    for (const t of tokens) {
        const v = resolveToken(t.key, maps, inputs);
        const fragment = isInsideQuotes(t.start)
            ? JSON.stringify(String(v ?? ""))
            : JSON.stringify(v ?? null);

        result = result.split(t.raw).join(fragment);
    }

    try {
        return JSON.parse(result);
    } catch {
        return null;
    }
}

export async function run(ctx, node, inputs, _event) {
    const context = ctx || {};
    const logger = context.logger || console;

    const data = node?.data || {};
    const mode = data.mode === "string" ? "string" : "json";
    const template = typeof data.template === "string" ? data.template : (mode === "string" ? "" : "{}");

    const maps = buildVarMaps({ inputs, data, context });

    if (mode === "string") {
        const value = renderString(template, maps, inputs);
        return { value };
    }

    const value = renderJson(template, maps, inputs);
    return { value };
}

export default { run };
