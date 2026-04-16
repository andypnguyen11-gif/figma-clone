"""
Redis primitives for per-user cursor positions on a canvas.

One key per user so TTL applies independently; keys expire when a client stops
sending ``cursor:move`` (no Redis scan needed for MVP).
"""

from __future__ import annotations

import uuid

from redis import Redis

PRESENCE_TTL_SECONDS = 20


def presence_key(canvas_id: uuid.UUID, user_id: uuid.UUID) -> str:
    """Redis key storing JSON cursor payload for a user in a canvas."""
    return f"presence:canvas:{canvas_id}:user:{user_id}"


def set_cursor(
    redis: Redis,
    canvas_id: uuid.UUID,
    user_id: uuid.UUID,
    payload_json: str,
    ttl_seconds: int = PRESENCE_TTL_SECONDS,
) -> None:
    """Persist cursor JSON and refresh TTL on each update."""
    redis.set(presence_key(canvas_id, user_id), payload_json, ex=ttl_seconds)


def delete_cursor(
    redis: Redis,
    canvas_id: uuid.UUID,
    user_id: uuid.UUID,
) -> None:
    """Remove presence when the socket disconnects."""
    redis.delete(presence_key(canvas_id, user_id))
