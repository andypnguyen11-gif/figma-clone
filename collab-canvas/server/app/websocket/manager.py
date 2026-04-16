"""
Registry of active WebSocket connections grouped by canvas ID.

The manager is process-local memory (one dict). Horizontal scaling in
production will pair this with Redis pub/sub (PR-14+) so events reach
peers on other workers.
"""

import uuid

from starlette.websockets import WebSocket


class ConnectionManager:
    """Track WebSockets per canvas room for broadcasts and metrics."""

    def __init__(self) -> None:
        self._by_canvas: dict[uuid.UUID, list[WebSocket]] = {}

    def register(self, canvas_id: uuid.UUID, websocket: WebSocket) -> None:
        """Attach a socket to a canvas room after ``accept()``."""
        self._by_canvas.setdefault(canvas_id, []).append(websocket)

    def unregister(self, canvas_id: uuid.UUID, websocket: WebSocket) -> None:
        """Remove a socket; called from ``finally`` on disconnect."""
        room = self._by_canvas.get(canvas_id)
        if not room:
            return
        self._by_canvas[canvas_id] = [ws for ws in room if ws is not websocket]
        if not self._by_canvas[canvas_id]:
            del self._by_canvas[canvas_id]

    def connection_count(self, canvas_id: uuid.UUID) -> int:
        """Return how many clients are connected to this canvas."""
        return len(self._by_canvas.get(canvas_id, ()))

    def iter_room(self, canvas_id: uuid.UUID) -> list[WebSocket]:
        """Snapshot of sockets in a room (for PR-14 broadcasts)."""
        return list(self._by_canvas.get(canvas_id, ()))

    async def broadcast_json(
        self, canvas_id: uuid.UUID, payload: dict[str, object]
    ) -> None:
        """Send JSON to every socket in the room; ignores broken connections."""
        for ws in self.iter_room(canvas_id):
            try:
                await ws.send_json(payload)
            except Exception:
                continue


connection_manager = ConnectionManager()
