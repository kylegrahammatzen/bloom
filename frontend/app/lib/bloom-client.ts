import { useAuth } from "./auth-context";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ============= Types =============
export type User = {
	id: string;
	email: string;
	email_verified: boolean;
	created_at: string;
	last_login?: string;
};

export type Session = {
	user: User;
};

export type BloomError = {
	message: string;
	details?: any;
};

export type BloomResponse<T> = {
	data?: T;
	error?: BloomError;
};

// ============= Internal Helpers =============
async function apiFetch<T>(
	endpoint: string,
	options: RequestInit = {}
): Promise<BloomResponse<T>> {
	const url = `${API_URL}${endpoint}`;

	const defaultOptions: RequestInit = {
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			...options.headers,
		},
		...options,
	};

	try {
		const response = await fetch(url, defaultOptions);
		const data = await response.json();

		if (!response.ok) {
			return {
				error: data.error || {
					message: `Request failed with status ${response.status}`,
				},
			};
		}

		return { data };
	} catch (error) {
		return {
			error: {
				message: error instanceof Error ? error.message : "Network error",
			},
		};
	}
}

// ============= Client =============
export const bloomClient = {
	signUp: {
		email: async (body: {
			email: string;
			password: string;
		}): Promise<BloomResponse<Session>> => {
			// Register user
			const registerResponse = await apiFetch<{ user: User }>(
				"/api/auth/register",
				{
					method: "POST",
					body: JSON.stringify(body),
				}
			);

			if (registerResponse.error) {
				return { error: registerResponse.error };
			}

			// Auto-login after registration
			const loginResponse = await apiFetch<{ user: User }>("/api/auth/login", {
				method: "POST",
				body: JSON.stringify(body),
			});

			if (loginResponse.error) {
				return { error: loginResponse.error };
			}

			return {
				data: {
					user: loginResponse.data!.user,
				},
			};
		},
	},

	signIn: {
		email: async (body: {
			email: string;
			password: string;
		}): Promise<BloomResponse<Session>> => {
			const response = await apiFetch<{ user: User }>("/api/auth/login", {
				method: "POST",
				body: JSON.stringify(body),
			});

			if (response.error) {
				return { error: response.error };
			}

			return {
				data: {
					user: response.data!.user,
				},
			};
		},
	},

	signOut: async (): Promise<BloomResponse<{ message: string }>> => {
		return apiFetch("/api/auth/logout", {
			method: "POST",
		});
	},

	deleteAccount: async (): Promise<BloomResponse<{ message: string }>> => {
		return apiFetch("/api/auth/account", {
			method: "DELETE",
		});
	},

	useSession: () => {
		const { user, isLoading, refetch } = useAuth();
		return {
			data: user ? { user } : null,
			isLoading,
			refetch,
		};
	},

	// Type inference helper (like better-auth $Infer)
	$Infer: {
		Session: {} as Session,
		User: {} as User,
	},
};
