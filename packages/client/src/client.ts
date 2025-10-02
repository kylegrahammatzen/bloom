import { apiFetch } from "./fetch";
import { setClientConfig } from "./config";
import type {
	BloomResponse,
	Session,
	RequestOptions,
	ClientConfig,
} from "./types";

export function createBloomClient(config?: ClientConfig) {
	if (config) {
		setClientConfig(config);
	}

	return {
		signUp: {
			email: async (
				body: { email: string; password: string },
				options?: RequestOptions<Session>
			): Promise<BloomResponse<Session>> => {
				return apiFetch<Session>("/api/auth/register", {
					method: "POST",
					body: JSON.stringify(body),
					requestOptions: options,
				});
			},
		},

		signIn: {
			email: async (
				body: { email: string; password: string },
				options?: RequestOptions<Session>
			): Promise<BloomResponse<Session>> => {
				return apiFetch<Session>("/api/auth/login", {
					method: "POST",
					body: JSON.stringify(body),
					requestOptions: options,
				});
			},
		},

		signOut: async (
			options?: RequestOptions<{ message: string }>
		): Promise<BloomResponse<{ message: string }>> => {
			return apiFetch("/api/auth/logout", {
				method: "POST",
				requestOptions: options,
			});
		},

		deleteAccount: async (
			options?: RequestOptions<{ message: string }>
		): Promise<BloomResponse<{ message: string }>> => {
			return apiFetch("/api/auth/account", {
				method: "DELETE",
				requestOptions: options,
			});
		},

		getSession: async (
			options?: RequestOptions<Session>
		): Promise<BloomResponse<Session>> => {
			return apiFetch<Session>("/api/auth/me", {
				requestOptions: options,
			});
		},
	};
}

export const bloomClient = createBloomClient();
