"""
Tests for authenticated canvas WebSocket connections (PR-13).

Exercises JWT validation on the WebSocket handshake, rejection of
unauthenticated clients, and the connection manager registry.
"""

import uuid

import pytest
from starlette.websockets import WebSocketDisconnect

class TestCanvasWebSocketAuth:
    """WS /api/canvas/{canvas_id}/ws?token=<JWT>"""

    def _signup(self, client) -> dict:
        return client.post(
            "/api/auth/signup",
            json={
                "email": "ws-user@example.com",
                "password": "pass123456",
                "display_name": "WS User",
            },
        ).json()

    def _create_canvas(self, client, token: str) -> dict:
        return client.post(
            "/api/canvas",
            json={"title": "WS Canvas"},
            headers={"Authorization": f"Bearer {token}"},
        ).json()

    def test_connect_with_valid_jwt_sends_connected_then_room_peers(self, client):
        user = self._signup(client)
        canvas = self._create_canvas(client, user["access_token"])
        path = (
            f"/api/canvas/{canvas['id']}/ws"
            f"?token={user['access_token']}"
        )
        with client.websocket_connect(path) as ws:
            msg = ws.receive_json()
            assert msg["event"] == "connected"
            assert msg["canvas_id"] == canvas["id"]
            peers = ws.receive_json()
            assert peers["event"] == "room:peers"
            assert peers["canvas_id"] == canvas["id"]
            assert peers["peer_count"] == 1
            snap = ws.receive_json()
            assert snap["event"] == "lock:snapshot"
            assert snap["canvas_id"] == canvas["id"]
            assert snap["locks"] == []

    def test_connect_without_token_closes_before_messages(self, client):
        user = self._signup(client)
        canvas = self._create_canvas(client, user["access_token"])
        with pytest.raises(WebSocketDisconnect):
            with client.websocket_connect(f"/api/canvas/{canvas['id']}/ws"):
                pass

    def test_connect_with_invalid_token_closes_before_messages(self, client):
        user = self._signup(client)
        canvas = self._create_canvas(client, user["access_token"])
        with pytest.raises(WebSocketDisconnect):
            with client.websocket_connect(
                f"/api/canvas/{canvas['id']}/ws?token=not-a-valid-jwt"
            ):
                pass

    def test_connect_unknown_canvas_id_rejects(self, client):
        user = self._signup(client)
        random_canvas = uuid.uuid4()
        with pytest.raises(WebSocketDisconnect):
            with client.websocket_connect(
                f"/api/canvas/{random_canvas}/ws?token={user['access_token']}"
            ):
                pass

