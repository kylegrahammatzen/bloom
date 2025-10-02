import type { BloomResponse, RequestOptions } from "./types";
export declare function apiFetch<T>(endpoint: string, options?: RequestInit & {
    requestOptions?: RequestOptions<T>;
}): Promise<BloomResponse<T>>;
