import React, { type ReactNode } from "react";
import { createBloomClient } from "@bloom/client";
import type { User, Session, ClientConfig } from "@bloom/client";
type AuthContextType = {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    isSignedIn: boolean;
    signIn: ReturnType<typeof createBloomClient>["signIn"];
    signOut: ReturnType<typeof createBloomClient>["signOut"];
    signUp: ReturnType<typeof createBloomClient>["signUp"];
    deleteAccount: ReturnType<typeof createBloomClient>["deleteAccount"];
    refetch: () => Promise<void>;
};
export type BloomProviderProps = {
    children: ReactNode;
    baseURL?: string;
    config?: ClientConfig;
};
export declare function BloomProvider({ children, baseURL, config }: BloomProviderProps): React.JSX.Element;
export declare function useAuth(): AuthContextType;
export {};
