import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getCurrentUserEndpointHandler,
  loginUserEndpointHandler,
  registerUserEndpointHandler,
  logoutUserEndpointHandler,
} from "../api";
import { client } from "../api/client.gen";
import type { UserResponse } from "../api";

const API_BASE = "http://localhost:3187";

type AuthState = {
  user: UserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<{ ok: boolean; error?: string }>;
  register: (data: {
    userName: string;
    email: string;
    password: string;
    firstName: string;
    middleName?: string | null;
    lastName: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      client.setConfig({ baseUrl: API_BASE });
      const result = await getCurrentUserEndpointHandler();
      if (result.data?.success && result.data.data) {
        setUser(result.data.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    client.setConfig({ baseUrl: API_BASE });
    fetchUser().finally(() => setIsLoading(false));
  }, [fetchUser]);

  const extractError = (result: any): string => {
    // hey-api puts error bodies in result.error for non-2xx
    const errBody = result.error || result.data;
    if (!errBody) return "An unexpected error occurred.";
    const msg = errBody.message || "";
    const details = errBody.details;
    if (Array.isArray(details) && details.length > 0) {
      const msgs = details.map((d: any) => d.message).filter(Boolean);
      if (msgs.length > 0) return msgs.join(" ");
    }
    return msg || "An unexpected error occurred.";
  };

  const login = useCallback(
    async (identifier: string, password: string, rememberMe = false) => {
      try {
        client.setConfig({ baseUrl: API_BASE });
        const result = await loginUserEndpointHandler({
          body: { identifier, password, rememberMe },
        });
        if (result.response.ok) {
          await fetchUser();
          return { ok: true };
        }
        return { ok: false, error: extractError(result) };
      } catch (e: any) {
        return { ok: false, error: e?.message || "Login failed." };
      }
    },
    [fetchUser]
  );

  const register = useCallback(
    async (data: {
      userName: string;
      email: string;
      password: string;
      firstName: string;
      middleName?: string | null;
      lastName: string;
    }) => {
      try {
        client.setConfig({ baseUrl: API_BASE });
        const result = await registerUserEndpointHandler({
          body: {
            userName: data.userName,
            email: data.email,
            password: data.password,
            firstName: data.firstName,
            middleName: data.middleName ?? null,
            lastName: data.lastName,
          },
        });
        if (result.response.ok || result.response.status === 201) {
          return { ok: true };
        }
        return { ok: false, error: extractError(result) };
      } catch (e: any) {
        return { ok: false, error: e?.message || "Registration failed." };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      client.setConfig({ baseUrl: API_BASE });
      await logoutUserEndpointHandler();
    } catch {
      // ignore
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
