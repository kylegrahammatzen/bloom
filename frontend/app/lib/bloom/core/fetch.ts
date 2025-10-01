import type { BloomResponse, CallbackContext, RequestOptions } from "../types";
import { clientConfig } from "./config";

export async function apiFetch<T>(
	endpoint: string,
	options: RequestInit & { requestOptions?: RequestOptions<T> } = {}
): Promise<BloomResponse<T>> {
	const { requestOptions, ...fetchOptions } = options;
	const url = `${clientConfig.baseUrl}${endpoint}`;

	const defaultOptions: RequestInit = {
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			...fetchOptions.headers,
		},
		...fetchOptions,
	};

	let response: Response;
	let data: any;

	try {
		response = await fetch(url, defaultOptions);
		data = await response.json();
	} catch (error) {
		const errorResponse = {
			error: {
				message: error instanceof Error ? error.message : "Network error",
				status: 0,
				statusText: "Network Error",
			},
		};

		if (requestOptions?.onError) {
			await requestOptions.onError({
				error: errorResponse.error,
				response: new Response(),
			});
		}

		if (clientConfig.fetchOptions?.onError) {
			await clientConfig.fetchOptions.onError({
				error: errorResponse.error,
				response: new Response(),
			});
		}

		return errorResponse;
	}

	if (!response.ok) {
		const errorResponse = {
			error: {
				message: data.error?.message || `Request failed with status ${response.status}`,
				status: response.status,
				statusText: response.statusText,
				details: data.error?.details,
			},
		};

		const context: CallbackContext<T> = {
			error: errorResponse.error,
			response,
		};

		if (requestOptions?.onError) {
			await requestOptions.onError(context);
		}

		if (clientConfig.fetchOptions?.onError) {
			await clientConfig.fetchOptions.onError(context);
		}

		return errorResponse;
	}

	const successResponse = { data };
	const context: CallbackContext<T> = {
		data,
		response,
	};

	if (requestOptions?.onSuccess) {
		await requestOptions.onSuccess(context);
	}

	return successResponse;
}
