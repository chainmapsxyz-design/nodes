// nodes/core/Formatter/process.js

/**
 * Formatter process handler
 *
 * Contract:
 *   inputs: merged upstream values keyed by source handle id
 *           (e.g., { value: 123, amount: 5, json: {...} })
 *   data:   {
 *     mode: "json" | "string",
 *     template: string,
 *     // optional: availableParams from inspector wiring
 *     // availableParams: [{ name, type, src, nodeId, preview }, ...]
 *   }
 *   context: { logger?, incomingValues? }
 *
 * Returns:
 *   { value } where value is string (mode="string") or object (mode="json", or null on invalid)
 *
 * Notes:
 * - Token syntax:
 *     {{name}}           → resolves from inputs[name]
 *     {{src.name}}       → uses availableParams hint; falls back to inputs[name]
 *     {{src.name[2]}}    → best-effort disambiguation; requires context.incomingValues
 * - JSON mode:
 *     Replaces tokens with JSON-safe fragments. If substitution yields invalid JSON, returns { value: null }.
 * - String mode:
 *     Replaces tokens with stringified values (JSON.stringify for objects/arrays).
 */

function isObject(v) {
    return v !== null && typeof v === "object";
}

/**
 * Build a lookup map for tokens using available hints.
 * Returns:
 *   {
 *     bySimple: Map<name, value>,            // {{name}}
 *     byQualified: Map<"src.name", value>,   // {{src.name}}
 *     byIndexed: Map<"src.name[2]", value>,  // {{src.name[2]}}
 *   }
 *
 * Limitations:
 * - If multiple upstream edges provide the same handle name (e.g., "value"),
 *   the engine’s merged `inputs` may only contain one of them. Without
 *   `context.incomingValues` (array aligned to availableParams), duplicates
 *   cannot be perfectly disambiguated. We fall back to the single value.
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

        // Prefer explicit per-edge value when provided by context.incomingValues;
        // otherwise fall back to inputs[name].
        let val = undefined;
        if (incomingValues && idx < incomingValues.length) {
            val = incomingValues[idx];
        } else if (inputs && Object.prototype.hasOwnProperty.call(inputs, name)) {
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
 * raw: the full matched token including braces, e.g. "{{foo}}"
 * key: the inner key, e.g. "foo" or "src.name[2]"
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
 * Resolve token key to a value using maps.
 */
function resolveToken(key, maps) {
    // Qualified with index?
    if (/\[[0-9]+\]$/.test(key)) {
        const v = maps.byIndexed.get(key);
        if (typeof v !== "undefined") return v;
    }
    // Qualified without index
    if (key.includes(".")) {
        const v = maps.byQualified.get(key);
        if (typeof v !== "undefined") return v;
    }
    // Simple name
    if (maps.bySimple.has(key)) return maps.bySimple.get(key);
    return undefined;
}

/**
 * Replace tokens in "string" mode.
 * Values are stringified for objects/arrays; primitives are String(value).
 */
function renderString(template, maps) {
    if (typeof template !== "string" || template.length === 0) return "";
    const tokens = findTokens(template);
    if (tokens.length === 0) return template;

    let out = template;
    for (const t of tokens) {
        const v = resolveToken(t.key, maps);
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
 *
 * Heuristic:
 *  - If token appears within JSON quotes, insert an escaped JSON string.
 *  - Else, insert JSON.stringify(value) (so numbers/booleans/null remain unquoted).
 *
 * Finally, we try JSON.parse on the result; if it fails, we return null.
 */
function renderJson(template, maps) {
    if (typeof template !== "string" || template.length === 0) return null;
    const tokens = findTokens(template);
    if (tokens.length === 0) {
        try {
            return JSON.parse(template);
        } catch {
            return null;
        }
    }

    // Build a char array for context checks
    const chars = Array.from(template);

    // Helper: detect whether position 'i' is currently inside a double-quoted JSON string.
    // This is a simplistic scanner that tracks quotes and backslash escapes.
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
        const v = resolveToken(t.key, maps);
        // Choose fragment based on context
        const fragment = isInsideQuotes(t.start)
            ? JSON.stringify(String(v ?? "")) // inside quotes → always a JSON string
            : JSON.stringify(v ?? null); // bare → proper JSON literal

        result = result.split(t.raw).join(fragment);
    }

    try {
        return JSON.parse(result);
    } catch {
        return null;
    }
}

export async function run({ inputs, data, context = {} }) {
    const logger = context.logger || console;

    const mode = data?.mode === "string" ? "string" : "json";
    const template = typeof data?.template === "string" ? data.template : mode === "string" ? "" : "{}";

    const maps = buildVarMaps({ inputs, data, context });

    if (mode === "string") {
        const value = renderString(template, maps);
        return { value };
    }

    // json
    const value = renderJson(template, maps);
    return { value }; // may be null if invalid JSON after substitution
}

export default { run };
