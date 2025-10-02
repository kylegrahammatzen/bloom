import type { BloomError } from "./error";
export type CallbackContext<T = any> = {
    data?: T;
    error?: BloomError;
    response: Response;
};
export type RequestOptions<T = any> = {
    onSuccess?: (ctx: CallbackContext<T>) => void | Promise<void>;
    onError?: (ctx: CallbackContext<T>) => void | Promise<void>;
};
export type FetchOptions = {
    onError?: (ctx: CallbackContext) => void | Promise<void>;
};
export type ClientConfig = {
    baseUrl?: string;
    fetchOptions?: FetchOptions;
};
