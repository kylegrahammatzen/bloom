import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authApi } from "./api";
import type { User } from "./bloom-client";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isSignedIn: boolean;
  refetch: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function BloomProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    const response = await authApi.me();
    if (response.data?.user) {
      setUser(response.data.user);
      console.log("User signed in:", response.data.user);
    } else {
      setUser(null);
      console.log("User not signed in");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isSignedIn: user !== null,
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
