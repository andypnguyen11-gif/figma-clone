/**
 * AuthProvider — restores auth state from localStorage on app startup.
 *
 * On mount, checks for a persisted JWT token. If found, calls /api/auth/me
 * to validate it and hydrate the auth store. If the token is expired or
 * invalid the user is logged out and redirected to /login.
 */
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAuthStore } from "../../features/auth/authStore.ts";
import { authApi } from "../../services/api/authApi.ts";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [ready, setReady] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setReady(true);
      return;
    }

    authApi
      .getMe(token)
      .then((user) => {
        setAuth(
          { id: user.id, email: user.email, displayName: user.display_name },
          token,
        );
      })
      .catch(() => {
        logout();
      })
      .finally(() => {
        setReady(true);
      });
  }, [setAuth, logout]);

  if (!ready) {
    return (
      <div className="auth-loading">
        <p>Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}
