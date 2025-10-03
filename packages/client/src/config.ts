import type { ClientConfig } from "@/types";

export let clientConfig: ClientConfig = {
	baseUrl: "http://localhost:5000",
};

export function setClientConfig(config: Partial<ClientConfig>) {
	clientConfig = { ...clientConfig, ...config };
}
