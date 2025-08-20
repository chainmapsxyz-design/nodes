// nodes/events/index.js
import {
    registerFrontend as registerEthereumListenerFrontend,
    registerRuntime as registerEthereumListenerRuntime,
} from "./EthereumListener/index.js";

export function registerEventsFrontend(registries) {
    registerEthereumListenerFrontend(registries);
    // add more core nodes here as you create them
}

export function registerEventsRuntime(registries) {
    registerEthereumListenerRuntime(registries);
    // add more core nodes here as you create them
}