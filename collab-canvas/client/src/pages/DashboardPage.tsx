/**
 * DashboardPage — post-login landing page.
 *
 * Lists canvases owned by the user (GET /api/canvas) with links to open
 * them. Also supports creating a new canvas or joining via share token.
 */
import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../features/auth/authStore.ts";
import { canvasApi } from "../services/api/canvasApi.ts";
import type { CanvasResponseDTO } from "../services/api/canvasApi.ts";

export function DashboardPage() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const [myCanvases, setMyCanvases] = useState<CanvasResponseDTO[]>([]);
  const [canvasListLoading, setCanvasListLoading] = useState(true);
  const [canvasListError, setCanvasListError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [shareToken, setShareToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    setCanvasListLoading(true);
    setCanvasListError(null);

    canvasApi
      .listMine(token)
      .then((rows) => {
        if (!cancelled) setMyCanvases(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          setCanvasListError(
            err instanceof Error ? err.message : "Failed to load canvases",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setCanvasListLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

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
        <div className="dashboard-content-cluster">
          {error && (
            <div role="alert" className="auth-error">
              {error}
            </div>
          )}

          <div className="dashboard-columns">
          <div className="dashboard-column-left">
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
          </div>

          <section
            className="dashboard-card dashboard-my-canvases"
            aria-labelledby="your-canvases-heading"
          >
            <h2 id="your-canvases-heading">Your canvases</h2>
            <div className="dashboard-canvas-list-scroll">
              {canvasListLoading && (
                <p className="dashboard-list-hint">Loading your canvases…</p>
              )}
              {!canvasListLoading && canvasListError && (
                <div role="alert" className="auth-error">
                  {canvasListError}
                </div>
              )}
              {!canvasListLoading && !canvasListError && myCanvases.length === 0 && (
                <p className="dashboard-list-empty">
                  No canvases yet — create one or join with a token.
                </p>
              )}
              {!canvasListLoading && !canvasListError && myCanvases.length > 0 && (
                <ul className="dashboard-canvas-list">
                  {myCanvases.map((c) => (
                    <li key={c.id}>
                      <Link className="dashboard-canvas-link" to={`/canvas/${c.id}`}>
                        <span className="dashboard-canvas-title">{c.title}</span>
                        <span className="dashboard-canvas-meta">
                          Updated{" "}
                          {new Date(c.updated_at).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
        </div>
      </main>
    </div>
  );
}
