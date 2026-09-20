import { createContext, useContext } from "react";
import type { UserResponse } from "../api";

export type AuthState = {
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

// Lives in its own module (no components) so react-refresh/only-export-components
// stays silent — see AuthProvider.tsx for the component.
export const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
