import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authClient, type User, type Session } from "./bloom";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isSignedIn: boolean;
  refetch: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function BloomProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    const response = await authClient.getSession();
    if (response.data) {
      setSession(response.data);
      console.log("User signed in:", response.data);
    } else {
      setSession(null);
      console.log("User not signed in");
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
