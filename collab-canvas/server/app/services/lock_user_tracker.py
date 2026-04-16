"""
Process-local map of which canvas elements a user currently holds locks on.

Used on WebSocket disconnect to release Redis keys and broadcast ``lock:release``
so TTL alone is not the only cleanup path when a client closes abruptly.
"""

from __future__ import annotations

import uuid
from collections import defaultdict


class LockUserTracker:
    """Tracks ``(canvas_id, element_id)`` pairs per user (in-process only)."""

    def __init__(self) -> None:
        self._by_user: dict[
            uuid.UUID, list[tuple[uuid.UUID, uuid.UUID]]
        ] = defaultdict(list)

    def record(self, user_id: uuid.UUID, canvas_id: uuid.UUID, element_id: uuid.UUID) -> None:
        """Record that ``user_id`` holds ``element_id`` on ``canvas_id``."""
        t = (canvas_id, element_id)
        lst = self._by_user[user_id]
        if t not in lst:
            lst.append(t)

    def remove(self, user_id: uuid.UUID, canvas_id: uuid.UUID, element_id: uuid.UUID) -> None:
        """Drop one tracked lock for ``user_id``."""
        t = (canvas_id, element_id)
        lst = self._by_user.get(user_id)
        if not lst:
            return
        self._by_user[user_id] = [x for x in lst if x != t]
        if not self._by_user[user_id]:
            del self._by_user[user_id]

    def pop_all(self, user_id: uuid.UUID) -> list[tuple[uuid.UUID, uuid.UUID]]:
        """Return and clear every tracked lock for ``user_id``."""
        return self._by_user.pop(user_id, [])


lock_user_tracker = LockUserTracker()
