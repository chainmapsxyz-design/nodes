// nodes/core/index.js
import {
    registerFrontend as registerConstantFrontend,
    registerRuntime as registerConstantRuntime,
} from "./Constant/index.js";

import {
    registerFrontend as registerFormatterFrontend,
    registerRuntime as registerFormatterRuntime,
} from "./Formatter/index.js";

export function registerCoreFrontend(registries) {
    registerConstantFrontend(registries);
    registerFormatterFrontend(registries);
    // add more core nodes here as you create them
}

export function registerCoreRuntime(registries) {
    registerConstantRuntime(registries);
    registerFormatterRuntime(registries);
    // add more core nodes here as you create them
}