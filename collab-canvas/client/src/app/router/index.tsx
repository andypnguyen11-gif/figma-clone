/**
 * App router — defines the route structure for the SPA.
 *
 * Unauthenticated users are redirected to /login. Authenticated
 * users hitting /login or /signup are redirected to /.
 */
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuthStore } from "../../features/auth/authStore.ts";
import { LoginPage } from "../../pages/LoginPage.tsx";
import { SignupPage } from "../../pages/SignupPage.tsx";
import { CanvasPage } from "../../pages/CanvasPage.tsx";
import { DashboardPage } from "../../pages/DashboardPage.tsx";
import { AuthProvider } from "../providers/AuthProvider.tsx";

function RequireAuth({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function GuestOnly({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <GuestOnly>
                <LoginPage />
              </GuestOnly>
            }
          />
          <Route
            path="/signup"
            element={
              <GuestOnly>
                <SignupPage />
              </GuestOnly>
            }
          />
          <Route
            path="/"
            element={
              <RequireAuth>
                <DashboardPage />
              </RequireAuth>
            }
          />
          <Route
            path="/canvas/:canvasId"
            element={
              <RequireAuth>
                <CanvasPage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
