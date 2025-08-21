// nodes/webhook/process.js

/**
 * Webhook process handler
 *
 * Contract:
 *   inputs: merged upstream values keyed by source handle (expects exactly one)
 *   node.data: { method, url, headers: [{key,value}] | {k:v}, timeoutMs }
 *   ctx: { fetchImpl?, logger?, abortSignal? }
 *
 * Returns:
 *   { response, status, ok }
 */

function normalizeHeaders(headers) {
    if (Array.isArray(headers)) {
        const out = {};
        for (const h of headers) {
            const k = String(h?.key || "").trim();
            if (!k) continue;
            out[k] = String(h?.value ?? "");
        }
        return out;
    }
    if (headers && typeof headers === "object") {
        return { ...headers };
    }
    return {};
}

function firstInput(inputs) {
    if (!inputs || typeof inputs !== "object") return undefined;
    if ("in" in inputs) return inputs.in;
    if ("value" in inputs) return inputs.value;
    const k = Object.keys(inputs)[0];
    return k ? inputs[k] : undefined;
}

function withTimeout(signal, ms) {
    if (!Number.isFinite(ms) || ms <= 0) return { signal, cancel: () => { } };
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(new Error("Request timed out")), ms);
    const cancel = () => clearTimeout(timer);
    if (signal && typeof signal.addEventListener === "function") {
        if (signal.aborted) ctrl.abort(signal.reason);
        else signal.addEventListener("abort", () => ctrl.abort(signal.reason), { once: true });
    }
    return { signal: ctrl.signal, cancel };
}

async function parseResponse(res) {
    const ctype = res.headers.get("content-type") || "";
    if (ctype.includes("application/json")) {
        try {
            const json = await res.json();
            return json;
        } catch {
            // fall through to text if JSON parse fails
        }
    }
    try {
        return await res.text();
    } catch {
        return null;
    }
}

export async function run(ctx, node, inputs, _event) {
    const logger = ctx?.logger || console;
    const fetchImpl =
        ctx?.fetchImpl || (typeof fetch !== "undefined" ? fetch.bind(globalThis) : null);

    if (!fetchImpl) {
        throw new Error("Webhook node: no fetch implementation available.");
    }

    const data = node?.data || {};
    const method = String(data.method || "POST").toUpperCase();
    let url = String(data.url || "").trim();
    const timeoutMs = Number.isFinite(data.timeoutMs) ? data.timeoutMs : 10000;

    if (!url) {
        throw new Error("Webhook node: URL is required.");
    }

    const payload = firstInput(inputs);

    const hdrs = normalizeHeaders(data.headers);
    const headers = new Headers();
    for (const [k, v] of Object.entries(hdrs)) {
        if (k) headers.set(k, String(v));
    }

    const isGetLike = method === "GET";
    let body = undefined;

    if (isGetLike) {
        try {
            const u = new URL(url);
            u.searchParams.set("data", JSON.stringify(payload ?? null));
            url = u.toString();
        } catch {
            const sep = url.includes("?") ? "&" : "?";
            const enc = encodeURIComponent(JSON.stringify(payload ?? null));
            url = `${url}${sep}data=${enc}`;
        }
    } else {
        if (!headers.has("Content-Type")) {
            headers.set("Content-Type", "application/json");
        }
        body = JSON.stringify(payload ?? null);
    }

    const { signal, cancel } = withTimeout(ctx?.abortSignal, timeoutMs);
    let res;
    try {
        res = await fetchImpl(url, {
            method,
            headers,
            body,
            signal,
        });
    } catch (err) {
        cancel();
        return {
            response: { error: String(err?.message || err) },
            status: 0,
            ok: false,
        };
    } finally {
        cancel();
    }

    let parsed;
    try {
        parsed = await parseResponse(res);
    } catch {
        parsed = null;
    }

    return {
        response: parsed,
        status: res.status,
        ok: res.ok,
    };
}

export default { run };
