# Nodes Kit — `meta.js` Reference & Registration (MVP)

`meta.js` declares a node’s identity, palette info, I/O, configuration defaults, and runtime hints.  
Frontend uses it to render/search nodes; backend uses it to look up handlers and understand outputs.

---

## Quick rules

- **`type`** is the stable, unique ID for the node (e.g. `"core.constant"`). Don’t change it after publish.
- **`process.run()`** must return keys that exist in **`outputs[*].key`**.
- **`getInitialData()`** must be pure and JSON-serializable.

---

## Fields

| Key               | Type                                  | Purpose (short) |
|-------------------|---------------------------------------|-----------------|
| `label`           | `string`                              | Display name in palette/inspector. |
| `version`         | `string` (SemVer)                     | Node version for changelogs/migrations. |
| `description`     | `string`                              | One-line help/tooltip text. |
| `keywords`        | `string[]`                            | Palette search terms. |
| `type`            | `string`                              | Stable runtime/frontend ID (e.g. `"core.constant"`). |
| `category`        | `string`                              | High-level grouping (e.g. `"Core"`). |
| `subcategory`     | `string`                              | Optional secondary grouping. |
| `icon`            | `string`                              | Emoji/icon shown in palette. |
| `color`           | `string`                              | UI theming hook (optional). |
| `colorAlt`        | `string`                              | Alternate theming hook (optional). |
| `blockchains`     | `string[]`                            | Supported chains (e.g. `["all"]`). |
| `maxPerGraph`     | `number`                              | Restriction on graph placement. |
| `inputs`          | `Array<IO>`                           | Declares input handles. |
| `outputs`         | `Array<IO>`                           | Declares output handles (must match `run()` keys). |
| `config`          | `Array<ConfigField>`                  | Inspector schema for `node.data`. |
| `getInitialData`  | `() => object`                        | Default `node.data` when node is created. |
| `isDeterministic` | `boolean`                             | Same inputs → same outputs (`true` for pure transforms). |
| `hasSideEffects`  | `boolean`                             | Sends/writes externally (e.g., webhooks) when `true`. |

**Types**

- **IO**:  
  `{ key: string; label?: string; type?: string | string[] }`  
  Common `type` values: `"string" | "number" | "boolean" | "object" | "null" | "any" | "json"`.

- **ConfigField**:  
  `{ key: string; label?: string; type?: "string"|"number"|"boolean"|"json"|"any"|"enum"; required?: boolean; default?: any; options?: string[] }`

---

## Registration pattern (per-node registrar)

Add an `index.js` in each node folder that registers both **frontend** and **runtime**.

**`nodes/<category>/<Name>/index.js`**
```js
import { meta } from "./meta.js";
import UI from "./ui.jsx";
import Inspector from "./inspector.jsx";
import { run } from "./process.js";

export function registerFrontend({ nodeTypes, inspectorRegistry, nodePalette }) {
  nodeTypes[meta.type] = UI;
  if (Inspector) inspectorRegistry[meta.type] = Inspector;

  nodePalette.push({
    type: meta.type,
    label: meta.label,
    icon: meta.icon || "🧩",
    getData: meta.getInitialData || (() => ({})),
    enabled: meta.enabled || (() => true),
    category: meta.category || "General",
    subcategory: meta.subcategory || "",
    description: meta.description || "",
    keywords: meta.keywords || [],
    color: meta.color || "default",
    colorAlt: meta.colorAlt || "default",
  });
}

export function registerRuntime({ handlers }) {
  handlers.set(meta.type, { run });
}
```

**Category aggregator** keeps one line per node:

**`nodes/<category>/index.js`**
```js
import {
  registerFrontend as registerConstantFrontend,
  registerRuntime as registerConstantRuntime,
} from "./Constant/index.js";

export function registerCoreFrontend(reg) {
  registerConstantFrontend(reg);
  // add more core nodes here
}

export function registerCoreRuntime(reg) {
  registerConstantRuntime(reg);
  // add more core nodes here
}
```

**Frontend entry** stays tiny:

**`nodes/frontend/index.js`**
```js
import { registerCoreFrontend } from "../core/index.js";

export const nodeTypes = {};
export const inspectorRegistry = {};
export const nodePalette = [];

registerCoreFrontend({ nodeTypes, inspectorRegistry, nodePalette });
// later: register other categories here
```

**Runtime entry** mirrors it:

**`nodes/runtime/index.js`**
```js
import { registerCoreRuntime } from "../core/index.js";

export const handlers = new Map();

registerCoreRuntime({ handlers });
// later: register other categories here

export const getHandler = (type) => handlers.get(type);
export function register({ type, run }) {
  if (!type || typeof run !== "function") throw new Error("Invalid handler");
  handlers.set(type, { run });
}
```

**Add a new node (flow)**
1. Create `nodes/<category>/<NewNode>/{meta.js, ui.jsx, inspector.jsx, process.js, index.js}`.
2. Add **one import + call** in `nodes/<category>/index.js`.
3. Done. Frontend and runtime pick it up via the category registrars.

---

## Example `meta.js` (Constant)

```js
export const meta = {
  // Identity & catalog
  label: "Constant",
  version: "1.0.0",
  description: "A node that outputs a static value.",
  keywords: ["number", "string", "constant", "value"],
  type: "core.constant",
  category: "Core",
  subcategory: "",
  icon: "🔢",
  color: "default",
  colorAlt: "default",
  blockchains: ["all"],

  // I/O
  inputs: [],
  outputs: [
    { key: "value", label: "Value", type: ["number","string","boolean","object","null"] }
  ],

  // Inspector schema
  config: [
    { key: "value", label: "Value", type: "any", required: true, default: 0 }
  ],

  // Defaults for new node instances
  getInitialData: () => ({ value: 0 }),

  // Runtime hints
  isDeterministic: true,
  hasSideEffects: false
};
```
