import React, { useState, useEffect, useCallback } from "react";
import {
  getCurrentUserEndpointHandler,
  loginUserEndpointHandler,
  registerUserEndpointHandler,
  logoutUserEndpointHandler,
} from "../api";
import { client } from "../api/client.gen";
import type { UserResponse } from "../api";
import { AuthContext } from "./AuthContext";

const API_BASE = "http://localhost:3187";

type ApiErrorBody = {
  message?: string;
  title?: string;
  details?: { message?: string }[];
};

type ApiResult = {
  error?: unknown;
  data?: unknown;
};

function getErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      client.setConfig({ baseUrl: API_BASE, credentials: 'include' });
      const result = await getCurrentUserEndpointHandler();
      console.log('[fetchUser] result:', result);
      if (result.data?.success && result.data.data) {
        setUser(result.data.data);
      } else {
        console.log('[fetchUser] no user data, error:', result.error);
        setUser(null);
      }
    } catch (e) {
      console.log('[fetchUser] exception:', e);
      setUser(null);
    } finally {
      // Loading ends with the first fetch, so the effect below performs no
      // direct setState and stays clear of react-hooks/set-state-in-effect.
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const extractError = (result: ApiResult): string => {
    // hey-api puts error bodies in result.error for non-2xx
    const errBody = (result.error ?? result.data) as ApiErrorBody | undefined;
    if (!errBody) return "An unexpected error occurred.";
    const msg = errBody.message || "";
    const details = errBody.details;
    if (Array.isArray(details) && details.length > 0) {
      const msgs = details.map((d) => d.message).filter(Boolean);
      if (msgs.length > 0) return msgs.join(" ");
    }
    return msg || "An unexpected error occurred.";
  };

  const login = useCallback(
    async (identifier: string, password: string, rememberMe = false) => {
      try {
        client.setConfig({ baseUrl: API_BASE, credentials: 'include' });
        const result = await loginUserEndpointHandler({
          body: { identifier, password, rememberMe },
        });
        console.log('[login] result:', result, 'response.ok:', result.response?.ok, 'status:', result.response?.status);
        if (result.response?.ok) {
          await fetchUser();
          return { ok: true };
        }
        return { ok: false, error: extractError(result) };
      } catch (e: unknown) {
        return { ok: false, error: getErrorMessage(e, "Login failed.") };
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
        client.setConfig({ baseUrl: API_BASE, credentials: 'include' });
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
        if (result.response?.ok || result.response?.status === 201) {
          return { ok: true };
        }
        return { ok: false, error: extractError(result) };
      } catch (e: unknown) {
        return { ok: false, error: getErrorMessage(e, "Registration failed.") };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      client.setConfig({ baseUrl: API_BASE, credentials: 'include' });
      await logoutUserEndpointHandler();
    } catch {
      // ignore — signing out locally is safe even if the server call fails
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
