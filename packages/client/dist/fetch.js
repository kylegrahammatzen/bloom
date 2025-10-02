"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiFetch = apiFetch;
const config_1 = require("./config");
async function apiFetch(endpoint, options = {}) {
    const { requestOptions, ...fetchOptions } = options;
    const url = `${config_1.clientConfig.baseUrl}${endpoint}`;
    const defaultOptions = {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...fetchOptions.headers,
        },
        ...fetchOptions,
    };
    let response;
    let data;
    try {
        response = await fetch(url, defaultOptions);
        data = await response.json();
    }
    catch (error) {
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
        if (config_1.clientConfig.fetchOptions?.onError) {
            await config_1.clientConfig.fetchOptions.onError({
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
        const context = {
            error: errorResponse.error,
            response,
        };
        if (requestOptions?.onError) {
            await requestOptions.onError(context);
        }
        if (config_1.clientConfig.fetchOptions?.onError) {
            await config_1.clientConfig.fetchOptions.onError(context);
        }
        return errorResponse;
    }
    const successResponse = { data };
    const context = {
        data,
        response,
    };
    if (requestOptions?.onSuccess) {
        await requestOptions.onSuccess(context);
    }
    return successResponse;
}
