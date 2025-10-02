import type { BloomResponse, Session, RequestOptions, ClientConfig } from "./types";
export declare function createBloomClient(config?: ClientConfig): {
    signUp: {
        email: (body: {
            email: string;
            password: string;
        }, options?: RequestOptions<Session>) => Promise<BloomResponse<Session>>;
    };
    signIn: {
        email: (body: {
            email: string;
            password: string;
        }, options?: RequestOptions<Session>) => Promise<BloomResponse<Session>>;
    };
    signOut: (options?: RequestOptions<{
        message: string;
    }>) => Promise<BloomResponse<{
        message: string;
    }>>;
    deleteAccount: (options?: RequestOptions<{
        message: string;
    }>) => Promise<BloomResponse<{
        message: string;
    }>>;
    getSession: (options?: RequestOptions<Session>) => Promise<BloomResponse<Session>>;
};
export declare const bloomClient: {
    signUp: {
        email: (body: {
            email: string;
            password: string;
        }, options?: RequestOptions<Session>) => Promise<BloomResponse<Session>>;
    };
    signIn: {
        email: (body: {
            email: string;
            password: string;
        }, options?: RequestOptions<Session>) => Promise<BloomResponse<Session>>;
    };
    signOut: (options?: RequestOptions<{
        message: string;
    }>) => Promise<BloomResponse<{
        message: string;
    }>>;
    deleteAccount: (options?: RequestOptions<{
        message: string;
    }>) => Promise<BloomResponse<{
        message: string;
    }>>;
    getSession: (options?: RequestOptions<Session>) => Promise<BloomResponse<Session>>;
};
