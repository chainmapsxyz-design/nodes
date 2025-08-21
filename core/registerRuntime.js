// nodes/core/runtime.js
import { registerRuntime as registerConstantRuntime } from "./Constant/registerRuntime.js";
import { registerRuntime as registerFormatterRuntime } from "./Formatter/registerRuntime.js";
// ...add more as you create them

export function registerCoreRuntime(registries) {
    registerConstantRuntime(registries);
    registerFormatterRuntime(registries);
}
