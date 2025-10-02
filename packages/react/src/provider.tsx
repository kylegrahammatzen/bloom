import React, { createContext, useContext, useEffect, useState, type ReactNode, useMemo } from "react";
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export type BloomProviderProps = {
  children: ReactNode;
  baseURL?: string;
  config?: ClientConfig;
}

export function BloomProvider({ children, baseURL, config }: BloomProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const client = useMemo(() => {
    return createBloomClient(config || { baseUrl: baseURL });
  }, [baseURL, config]);

  const fetchUser = async () => {
    const response = await client.getSession();
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
    signIn: client.signIn,
    signOut: client.signOut,
    signUp: client.signUp,
    deleteAccount: client.deleteAccount,
    refetch: fetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within BloomProvider");
  }
  return context;
}
