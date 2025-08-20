// src/nodes/core/Constant/meta.js
export const meta = {
  label: "Constant",
  version: "1.0.0",
  description: "A node that outputs a static value.",
  keywords: ["number", "string", "constant", "value"],
  type: "core.constant",
  category: "Core",
  subcategory: "",
  color: "default",
  colorAlt: "default",
  blockchains: ["all"],
  
  inputs: [],
  outputs: [
    { key: "value", label: "Value", type: ["number", "string", "boolean", "object", "null"] }
  ],

  inspector: [
    { key: "value", label: "Value", type: "any", required: true, default: 0 }
  ],

  getInitialData: () => ({ value: 0 }),

  isDeterministic: true,
  hasSideEffects: false
};
