import type { BloomError } from "./error";

export type RequestOptions<T = any> = {
	onSuccess?: (ctx: { data: T; response: Response }) => void | Promise<void>;
	onError?: (ctx: { error: BloomError; response: Response }) => void | Promise<void>;
};

export type FetchOptions = {
	onError?: (ctx: { error: BloomError; response: Response }) => void | Promise<void>;
};

export type ClientConfig = {
	baseUrl?: string;
	fetchOptions?: FetchOptions;
};
