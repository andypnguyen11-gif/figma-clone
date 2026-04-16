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

    def test_connect_with_valid_jwt_sends_connected_event(self, client):
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


class TestConnectionManager:
    """Socket registry exposed for collaboration rooms (used by PR-14+)."""

    def test_two_connections_same_canvas_are_tracked(self, client):
        """Manager counts two distinct sockets in the same canvas room."""
        a = client.post(
            "/api/auth/signup",
            json={
                "email": "peer-a@example.com",
                "password": "pass123456",
                "display_name": "Peer A",
            },
        ).json()
        b = client.post(
            "/api/auth/signup",
            json={
                "email": "peer-b@example.com",
                "password": "pass123456",
                "display_name": "Peer B",
            },
        ).json()
        canvas = client.post(
            "/api/canvas",
            json={"title": "Shared"},
            headers={"Authorization": f"Bearer {a['access_token']}"},
        ).json()

        from app.websocket.manager import connection_manager

        cid = uuid.UUID(canvas["id"])
        path_a = f"/api/canvas/{cid}/ws?token={a['access_token']}"
        path_b = f"/api/canvas/{cid}/ws?token={b['access_token']}"

        with client.websocket_connect(path_a) as ws_a:
            ws_a.receive_json()
            assert connection_manager.connection_count(cid) == 1
            with client.websocket_connect(path_b) as ws_b:
                ws_b.receive_json()
                assert connection_manager.connection_count(cid) == 2
            assert connection_manager.connection_count(cid) == 1
        assert connection_manager.connection_count(cid) == 0
