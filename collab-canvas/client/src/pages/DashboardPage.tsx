/**
 * DashboardPage — post-login landing page.
 *
 * Allows the user to create a new canvas or join an existing one
 * via share token. Keeps it minimal for MVP — no canvas listing yet.
 */
import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../features/auth/authStore.ts";
import { canvasApi } from "../services/api/canvasApi.ts";

export function DashboardPage() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [shareToken, setShareToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const canvas = await canvasApi.create(title || "Untitled Canvas", token);
      navigate(`/canvas/${canvas.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create canvas");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    if (!token || !shareToken.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const canvas = await canvasApi.joinByToken(shareToken.trim(), token);
      navigate(`/canvas/${canvas.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join canvas");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1 className="dashboard-logo">Collab Canvas</h1>
        <div className="dashboard-user">
          <span>{user?.displayName}</span>
          <button className="dashboard-logout" onClick={logout} type="button">
            Log out
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        {error && (
          <div role="alert" className="auth-error">
            {error}
          </div>
        )}

        <section className="dashboard-card">
          <h2>New canvas</h2>
          <form onSubmit={handleCreate} className="dashboard-form">
            <input
              className="auth-input"
              type="text"
              placeholder="Canvas title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <button className="auth-btn" type="submit" disabled={loading}>
              Create
            </button>
          </form>
        </section>

        <section className="dashboard-card">
          <h2>Join canvas</h2>
          <form onSubmit={handleJoin} className="dashboard-form">
            <input
              className="auth-input"
              type="text"
              placeholder="Paste share token"
              required
              value={shareToken}
              onChange={(e) => setShareToken(e.target.value)}
            />
            <button className="auth-btn" type="submit" disabled={loading}>
              Join
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
