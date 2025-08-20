// nodes/events/index.js
import {
    registerFrontend as registerEthereumListenerFrontend,
    registerRuntime as registerEthereumListenerRuntime,
} from "./EthereumListener/index.js";

import {
    registerFrontend as registerWebhookListenerFrontend,
    registerRuntime as registerWebhookListenerRuntime,
} from "./Webhook/index.js";

export function registerEventsFrontend(registries) {
    registerEthereumListenerFrontend(registries);
    registerWebhookListenerFrontend(
        registries
    )
    // add more core nodes here as you create them
}

export function registerEventsRuntime(registries) {
    registerEthereumListenerRuntime(registries);
    registerWebhookListenerRuntime(
        registries
    )
    // add more core nodes here as you create them
}