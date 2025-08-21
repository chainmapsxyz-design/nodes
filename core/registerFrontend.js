// nodes/core/frontend.js
import { registerFrontend as registerConstantFrontend } from "./Constant/registerFrontend.js";
import { registerFrontend as registerFormatterFrontend } from "./Formatter/registerFrontend.js";
// ...add more as you create them

export function registerCoreFrontend(registries) {
    registerConstantFrontend(registries);
    registerFormatterFrontend(registries);
}
