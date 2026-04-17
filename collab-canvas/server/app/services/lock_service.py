"""
Element lock orchestration — Redis + per-socket tracking + broadcast payloads.

WS handlers call these functions; REST uses :func:`ensure_element_lock` before
mutating rows that require an exclusive lock.
"""

from __future__ import annotations

import uuid

from fastapi import HTTPException, status
from redis import Redis

from app.models.user import User
from app.redis import locks as redis_locks
from app.services import user_palette
from app.services.lock_user_tracker import lock_user_tracker
from app.websocket.events import (
    EVENT_LOCK_ACQUIRE,
    EVENT_LOCK_RELEASE,
    EVENT_LOCK_SNAPSHOT,
)


def ensure_element_lock(
    redis_client: Redis,
    canvas_id: uuid.UUID,
    element_id: uuid.UUID,
    user_id: uuid.UUID,
) -> None:
    """Raise 423 only when another user holds the Redis lock.

    If no key exists (no collaborator has acquired yet), REST mutations are
    allowed so saves work before the WebSocket session is live. Once a lock
    key exists, the holder must match ``user_id``.
    """
    holder = redis_locks.get_holder(redis_client, canvas_id, element_id)
    if holder is None:
        return
    if holder != user_id:
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="Another user holds the lock on this element",
        )


def handle_lock_acquire(
    redis_client: Redis,
    canvas_id: uuid.UUID,
    element_id: uuid.UUID,
    user: User,
) -> bool:
    """Try to acquire; record on success. Returns True when this user holds the lock."""
    ok = redis_locks.try_acquire(redis_client, canvas_id, element_id, user.id)
    if ok:
        lock_user_tracker.record(user.id, canvas_id, element_id)
    return ok


def handle_lock_release(
    redis_client: Redis,
    canvas_id: uuid.UUID,
    element_id: uuid.UUID,
    user: User,
) -> bool:
    """Release if held; update tracker."""
    removed = redis_locks.release(redis_client, canvas_id, element_id, user.id)
    if removed:
        lock_user_tracker.remove(user.id, canvas_id, element_id)
    return removed


def handle_lock_heartbeat(
    redis_client: Redis,
    canvas_id: uuid.UUID,
    element_id: uuid.UUID,
    user: User,
) -> bool:
    """Refresh TTL if the user holds the lock."""
    return redis_locks.heartbeat(redis_client, canvas_id, element_id, user.id)


def lock_broadcast_payload(
    user: User,
    canvas_id: uuid.UUID,
    element_id: uuid.UUID,
) -> dict[str, object]:
    """Payload for ``lock:acquire`` broadcasts (all clients in the room)."""
    return {
        "event": EVENT_LOCK_ACQUIRE,
        "canvas_id": str(canvas_id),
        "element_id": str(element_id),
        "user_id": str(user.id),
        "user_name": user.display_name,
        "color": user_palette.user_color_hex(user.id),
    }


def lock_release_broadcast_payload(
    canvas_id: uuid.UUID,
    element_id: uuid.UUID,
) -> dict[str, object]:
    return {
        "event": EVENT_LOCK_RELEASE,
        "canvas_id": str(canvas_id),
        "element_id": str(element_id),
    }


def build_lock_snapshot_message(
    redis_client: Redis,
    canvas_id: uuid.UUID,
) -> dict[str, object]:
    """Build ``lock:snapshot`` for a joining client — active Redis locks + stable labels.

    Display names are not queried from the DB here: the WebSocket dependency may
    share a SQLite session with the test client, and nested sockets would block.
    Live ``lock:acquire`` broadcasts still carry ``User.display_name`` for editors.
    """
    pairs = redis_locks.iter_element_locks_for_canvas(redis_client, canvas_id)
    locks: list[dict[str, str]] = []
    seen_elements: set[uuid.UUID] = set()
    for element_id, holder_id in pairs:
        if element_id in seen_elements:
            continue
        seen_elements.add(element_id)
        locks.append(
            {
                "element_id": str(element_id),
                "user_id": str(holder_id),
                "user_name": "Collaborator",
                "color": user_palette.user_color_hex(holder_id),
            }
        )
    return {
        "event": EVENT_LOCK_SNAPSHOT,
        "canvas_id": str(canvas_id),
        "locks": locks,
    }


def release_all_tracked_for_user(
    redis_client: Redis,
    user_id: uuid.UUID,
) -> list[tuple[uuid.UUID, uuid.UUID]]:
    """On disconnect: clear Redis + return pairs for broadcasting release."""
    pairs = lock_user_tracker.pop_all(user_id)
    for canvas_id, element_id in pairs:
        redis_locks.release(redis_client, canvas_id, element_id, user_id)
    return pairs


# Test helper: grant lock without WS (pytest)
def grant_lock_for_test(
    redis_client: Redis,
    canvas_id: uuid.UUID,
    element_id: uuid.UUID,
    user_id: uuid.UUID,
) -> None:
    """Force-set a lock key (used by REST tests that PATCH after «acquire»)."""
    assert redis_locks.try_acquire(redis_client, canvas_id, element_id, user_id)
