"""
Lazily initialised Redis client using ``REDIS_URL``.

Tests override ``get_redis`` via monkeypatch (typically with fakeredis).
"""

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from redis import Redis

_redis: "Redis | None" = None


def get_redis() -> "Redis":
    """Return the shared Redis connection (decoded string values)."""
    global _redis
    if _redis is None:
        import redis

        from app.core.config import settings

        _redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis


def get_redis_dependency() -> "Redis":
    """FastAPI ``Depends`` hook — thin wrapper for tests that patch ``get_redis``."""
    return get_redis()
