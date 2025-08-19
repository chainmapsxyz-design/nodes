// nodes/runtime/index.js
// Auto-register all node handlers by scanning sibling folders for meta.js + process.js
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NODES_ROOT = path.resolve(__dirname, ".."); // .../nodes

const SKIP_DIRS = new Set(["frontend", "runtime", "node_modules", ".git"]);

export const handlers = new Map();

/** Walk directories under NODES_ROOT and collect {dir, metaPath, processPath} pairs */
function discover() {
    /** @type {Array<{dir:string, meta:string, proc:string}>} */
    const found = [];

    /** BFS to keep stack shallow */
    const q = [NODES_ROOT];
    while (q.length) {
        const dir = q.shift();
        const base = path.basename(dir);
        if (SKIP_DIRS.has(base)) continue;

        let stat;
        try { stat = fs.statSync(dir); } catch { continue; }
        if (!stat.isDirectory()) continue;

        // does this dir contain a node?
        const metaPath = path.join(dir, "meta.js");
        const procPath = path.join(dir, "process.js");

        const hasMeta = fs.existsSync(metaPath);
        const hasProc = fs.existsSync(procPath);

        if (hasMeta && hasProc) {
            found.push({ dir, meta: metaPath, proc: procPath });
            // do not descend further; a node folder is a leaf
            continue;
        }

        // enqueue children
        for (const entry of fs.readdirSync(dir)) {
            if (entry.startsWith(".")) continue;
            q.push(path.join(dir, entry));
        }
    }

    return found;
}

/** Load all nodes once at module init */
async function loadAll() {
    const nodes = discover();

    for (const n of nodes) {
        try {
            const metaMod = await import(pathToFileURL(n.meta).href);
            const procMod = await import(pathToFileURL(n.proc).href);

            const meta = metaMod?.meta;
            const run = procMod?.run;

            if (!meta?.type || typeof run !== "function") continue;

            handlers.set(meta.type, { run });
        } catch {
            // skip invalid nodes
        }
    }
}

// Top-level await to populate `handlers` before export use.
await loadAll();

/** Lookup a handler by node type */
export function getHandler(type) {
    return handlers.get(type);
}

/** Allow host to register private nodes at runtime */
export function register({ type, run }) {
    if (!type || typeof run !== "function") throw new Error("Invalid node handler");
    handlers.set(type, { run });
}
