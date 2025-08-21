// nodes/events/runtime.js
import { registerRuntime as registerEthereumListenerRuntime } from "./EthereumListener/registerRuntime.js";
import { registerRuntime as registerWebhookRuntime } from "./Webhook/registerRuntime.js";
// ...add more as you create them

export function registerEventsRuntime(registries) {
    registerEthereumListenerRuntime(registries);
    registerWebhookRuntime(registries);
}
