"""
Low-level Redis primitives for per-element editing locks.

Keys: ``lock:canvas:{canvas_id}:element:{element_id}`` holding the owner's
user id string. TTL defaults to 30s and is refreshed on successful acquire
(renew) or explicit heartbeat.
"""


import uuid

from redis import Redis

LOCK_TTL_SECONDS = 30


def lock_key(canvas_id: uuid.UUID, element_id: uuid.UUID) -> str:
    """Redis key for an element lock in a given canvas."""
    return f"lock:canvas:{canvas_id}:element:{element_id}"


def try_acquire(
    redis: Redis,
    canvas_id: uuid.UUID,
    element_id: uuid.UUID,
    user_id: uuid.UUID,
    ttl_seconds: int = LOCK_TTL_SECONDS,
) -> bool:
    """Attempt to become the lock holder.

    Returns True if this user holds the lock after the call (new acquire or
    renew) and False if another user holds it.
    """
    key = lock_key(canvas_id, element_id)
    uid = str(user_id)
    acquired = redis.set(key, uid, nx=True, ex=ttl_seconds)
    if acquired:
        return True
    holder = redis.get(key)
    if holder == uid:
        redis.expire(key, ttl_seconds)
        return True
    return False


def release(
    redis: Redis,
    canvas_id: uuid.UUID,
    element_id: uuid.UUID,
    user_id: uuid.UUID,
) -> bool:
    """Delete the lock only if ``user_id`` is the current holder."""
    key = lock_key(canvas_id, element_id)
    if redis.get(key) != str(user_id):
        return False
    redis.delete(key)
    return True


def heartbeat(
    redis: Redis,
    canvas_id: uuid.UUID,
    element_id: uuid.UUID,
    user_id: uuid.UUID,
    ttl_seconds: int = LOCK_TTL_SECONDS,
) -> bool:
    """Refresh TTL when ``user_id`` holds the lock."""
    key = lock_key(canvas_id, element_id)
    if redis.get(key) != str(user_id):
        return False
    return bool(redis.expire(key, ttl_seconds))


def get_holder(
    redis: Redis,
    canvas_id: uuid.UUID,
    element_id: uuid.UUID,
) -> uuid.UUID | None:
    """Return the current lock owner's user id, if any."""
    raw = redis.get(lock_key(canvas_id, element_id))
    if raw is None:
        return None
    try:
        return uuid.UUID(str(raw))
    except (ValueError, TypeError):
        return None
