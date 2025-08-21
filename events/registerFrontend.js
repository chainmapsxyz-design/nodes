// nodes/events/frontend.js
import { registerFrontend as registerEthereumListenerFrontend } from "./EthereumListener/registerFrontend.js";
import { registerFrontend as registerWebhookFrontend } from "./Webhook/registerFrontend.js";
// ...add more as you create them

export function registerEventsFrontend(registries) {
    registerEthereumListenerFrontend(registries);
    registerWebhookFrontend(registries);
}
