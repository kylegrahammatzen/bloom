import { apiFetch } from "@/fetch";
import { setClientConfig } from "@/config";
import type { BloomResponse, Session, RequestOptions, ClientConfig } from "@/types";

export function createBloomClient(config?: ClientConfig) {
	if (config) {
		setClientConfig(config);
	}

	return {
		signUp: async (
			body: { email: string; password: string },
			options?: RequestOptions<Session>
		): Promise<BloomResponse<Session>> => {
			return apiFetch<Session>("/api/auth/register", {
				method: "POST",
				body: JSON.stringify(body),
				requestOptions: options,
			});
		},

		signIn: async (
			body: { email: string; password: string },
			options?: RequestOptions<Session>
		): Promise<BloomResponse<Session>> => {
			return apiFetch<Session>("/api/auth/login", {
				method: "POST",
				body: JSON.stringify(body),
				requestOptions: options,
			});
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

		getSessions: async (
			options?: RequestOptions<{ sessions: Session[] }>
		): Promise<BloomResponse<{ sessions: Session[] }>> => {
			return apiFetch<{ sessions: Session[] }>("/api/auth/sessions", {
				requestOptions: options,
			});
		},

		revokeSession: async (
			sessionId: string,
			options?: RequestOptions<{ message: string }>
		): Promise<BloomResponse<{ message: string }>> => {
			return apiFetch("/api/auth/sessions/revoke", {
				method: "POST",
				body: JSON.stringify({ sessionId }),
				requestOptions: options,
			});
		},

		requestEmailVerification: async (
			options?: RequestOptions<{ message: string }>
		): Promise<BloomResponse<{ message: string }>> => {
			return apiFetch("/api/auth/request-email-verification", {
				method: "POST",
				requestOptions: options,
			});
		},

		requestPasswordReset: async (
			body: { email: string },
			options?: RequestOptions<{ message: string }>
		): Promise<BloomResponse<{ message: string }>> => {
			return apiFetch("/api/auth/request-password-reset", {
				method: "POST",
				body: JSON.stringify(body),
				requestOptions: options,
			});
		},
	};
}
