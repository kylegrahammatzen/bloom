'use client';

import { use, createContext, useEffect, useState, type ReactNode } from "react";
import { bloomClient } from "@bloom/client-v2";
import type { User, Session, ClientConfig } from "@bloom/client-v2";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isSignedIn: boolean;
  signIn: ReturnType<typeof bloomClient>["auth"]["login"];
  signOut: ReturnType<typeof bloomClient>["auth"]["logout"];
  signUp: ReturnType<typeof bloomClient>["auth"]["register"];
  getSessions: ReturnType<typeof bloomClient>["auth"]["getSessions"];
  revokeSession: ReturnType<typeof bloomClient>["auth"]["deleteSession"];
  requestEmailVerification: ReturnType<typeof bloomClient>["auth"]["sendVerificationEmail"];
  requestPasswordReset: ReturnType<typeof bloomClient>["auth"]["requestPasswordReset"];
  refetch: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export type BloomProviderProps = {
  children: ReactNode;
  baseURL?: string;
  config?: ClientConfig;
}

export function BloomProvider(props: BloomProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const client = bloomClient(props.config || { baseUrl: props.baseURL ?? '' });

  const fetchUser = async () => {
    const response = await client.auth.getSession();
    if (response.data) {
      setSession(response.data);
    } else {
      setSession(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const value: AuthContextType = {
    user: session?.user ?? null,
    session,
    isLoading,
    isSignedIn: session !== null,
    signIn: client.auth.login,
    signOut: client.auth.logout,
    signUp: client.auth.register,
    getSessions: client.auth.getSessions,
    revokeSession: client.auth.deleteSession,
    requestEmailVerification: client.auth.sendVerificationEmail,
    requestPasswordReset: client.auth.requestPasswordReset,
    refetch: fetchUser,
  };

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = use(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within BloomProvider");
  }
  return context;
}
