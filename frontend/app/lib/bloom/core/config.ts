import type { ClientConfig } from "../types";

export let clientConfig: ClientConfig = {
	baseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000",
};

export function setClientConfig(config: Partial<ClientConfig>) {
	clientConfig = { ...clientConfig, ...config };
}
