/**
 * SignupPage — full-screen registration form.
 *
 * On successful signup the auth store is populated and the user
 * is navigated to the canvas dashboard (root route).
 */
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../services/api/authApi.ts";
import { useAuthStore } from "../features/auth/authStore.ts";

export function SignupPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.signup({ email, password, displayName });
      setAuth(
        { id: res.id, email: res.email, displayName: res.display_name },
        res.access_token,
      );
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1 className="auth-title">Sign up</h1>

        {error && (
          <div role="alert" className="auth-error">
            {error}
          </div>
        )}

        <label className="auth-label" htmlFor="displayName">
          Display name
        </label>
        <input
          id="displayName"
          className="auth-input"
          type="text"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          autoComplete="name"
        />

        <label className="auth-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className="auth-input"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <label className="auth-label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          className="auth-input"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />

        <button className="auth-btn" type="submit" disabled={loading}>
          {loading ? "Creating account…" : "Sign up"}
        </button>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
