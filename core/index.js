// nodes/core/index.js
import {
    registerFrontend as registerConstantFrontend,
    registerRuntime as registerConstantRuntime,
} from "./Constant/index.js";

export function registerCoreFrontend(registries) {
    registerConstantFrontend(registries);
    // add more core nodes here as you create them
}

export function registerCoreRuntime(registries) {
    registerConstantRuntime(registries);
    // add more core nodes here as you create them
}