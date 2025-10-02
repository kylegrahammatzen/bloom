import type { BloomError } from "./error";

export type BloomResponse<T> = {
	data?: T;
	error?: BloomError;
};
