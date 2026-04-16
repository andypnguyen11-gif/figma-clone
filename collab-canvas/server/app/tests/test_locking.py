"""
Tests for Redis element locks and WebSocket lock protocol (PR-14).
"""

import uuid

import pytest

from app.redis import locks as redis_locks
from app.websocket.events import (
    EVENT_CONNECTED,
    EVENT_LOCK_ACQUIRE,
    EVENT_LOCK_DENIED,
    EVENT_ROOM_PEERS,
)


def _handshake(ws) -> None:
    """Consume ``connected`` then ``room:peers`` frames."""
    assert ws.receive_json()["event"] == EVENT_CONNECTED
    assert ws.receive_json()["event"] == EVENT_ROOM_PEERS


class TestRedisPrimitives:
    def test_try_acquire_second_user_fails(self, redis_client) -> None:
        canvas_id = uuid.uuid4()
        element_id = uuid.uuid4()
        user_a = uuid.uuid4()
        user_b = uuid.uuid4()
        assert redis_locks.try_acquire(redis_client, canvas_id, element_id, user_a)
        assert not redis_locks.try_acquire(redis_client, canvas_id, element_id, user_b)

    def test_same_user_re_acquire_refreshes_ttl(self, redis_client) -> None:
        canvas_id = uuid.uuid4()
        element_id = uuid.uuid4()
        user = uuid.uuid4()
        assert redis_locks.try_acquire(redis_client, canvas_id, element_id, user)
        assert redis_locks.try_acquire(redis_client, canvas_id, element_id, user)

    def test_release_only_by_holder(self, redis_client) -> None:
        canvas_id = uuid.uuid4()
        element_id = uuid.uuid4()
        user_a = uuid.uuid4()
        user_b = uuid.uuid4()
        redis_locks.try_acquire(redis_client, canvas_id, element_id, user_a)
        assert not redis_locks.release(redis_client, canvas_id, element_id, user_b)
        assert redis_locks.release(redis_client, canvas_id, element_id, user_a)


class TestWebSocketLockProtocol:
    def test_lock_acquire_denies_second_user(self, client, redis_client) -> None:
        owner = client.post(
            "/api/auth/signup",
            json={
                "email": "lock-owner@example.com",
                "password": "pass123456",
                "display_name": "Owner",
            },
        ).json()
        peer = client.post(
            "/api/auth/signup",
            json={
                "email": "lock-peer@example.com",
                "password": "pass123456",
                "display_name": "Peer",
            },
        ).json()
        canvas = client.post(
            "/api/canvas",
            json={"title": "Lock test"},
            headers={"Authorization": f"Bearer {owner['access_token']}"},
        ).json()
        element = client.post(
            f"/api/canvas/{canvas['id']}/elements",
            json={
                "element_type": "rectangle",
                "x": 0.0,
                "y": 0.0,
                "width": 10.0,
                "height": 10.0,
            },
            headers={"Authorization": f"Bearer {owner['access_token']}"},
        ).json()

        path_owner = f"/api/canvas/{canvas['id']}/ws?token={owner['access_token']}"
        path_peer = f"/api/canvas/{canvas['id']}/ws?token={peer['access_token']}"

        with client.websocket_connect(path_owner) as ws_owner:
            _handshake(ws_owner)
            with client.websocket_connect(path_peer) as ws_peer:
                _handshake(ws_peer)
                assert ws_owner.receive_json()["event"] == EVENT_ROOM_PEERS

                ws_owner.send_json(
                    {"event": "lock:acquire", "element_id": element["id"]}
                )
                assert ws_owner.receive_json()["event"] == EVENT_LOCK_ACQUIRE
                assert ws_peer.receive_json()["event"] == EVENT_LOCK_ACQUIRE

                ws_peer.send_json(
                    {"event": "lock:acquire", "element_id": element["id"]}
                )
                denied = ws_peer.receive_json()
                assert denied["event"] == EVENT_LOCK_DENIED
                assert denied["element_id"] == element["id"]

    def test_disconnect_releases_lock(self, client, redis_client) -> None:
        user = client.post(
            "/api/auth/signup",
            json={
                "email": "solo-lock@example.com",
                "password": "pass123456",
                "display_name": "Solo",
            },
        ).json()
        canvas = client.post(
            "/api/canvas",
            json={"title": "Solo"},
            headers={"Authorization": f"Bearer {user['access_token']}"},
        ).json()
        element = client.post(
            f"/api/canvas/{canvas['id']}/elements",
            json={
                "element_type": "circle",
                "x": 0.0,
                "y": 0.0,
                "width": 10.0,
                "height": 10.0,
            },
            headers={"Authorization": f"Bearer {user['access_token']}"},
        ).json()
        eid = uuid.UUID(str(element["id"]))
        cid = uuid.UUID(str(canvas["id"]))

        path = f"/api/canvas/{canvas['id']}/ws?token={user['access_token']}"
        with client.websocket_connect(path) as ws:
            _handshake(ws)
            ws.send_json({"event": "lock:acquire", "element_id": element["id"]})
            assert ws.receive_json()["event"] == EVENT_LOCK_ACQUIRE

        assert redis_locks.get_holder(redis_client, cid, eid) is None


class TestLockInvalidElement:
    def test_acquire_unknown_element_denied(self, client) -> None:
        user = client.post(
            "/api/auth/signup",
            json={
                "email": "bad-elem@example.com",
                "password": "pass123456",
                "display_name": "Bad",
            },
        ).json()
        canvas = client.post(
            "/api/canvas",
            json={"title": "X"},
            headers={"Authorization": f"Bearer {user['access_token']}"},
        ).json()
        path = f"/api/canvas/{canvas['id']}/ws?token={user['access_token']}"
        fake_id = "00000000-0000-0000-0000-000000000001"
        with client.websocket_connect(path) as ws:
            _handshake(ws)
            ws.send_json({"event": "lock:acquire", "element_id": fake_id})
            msg = ws.receive_json()
            assert msg["event"] == EVENT_LOCK_DENIED
            assert msg["element_id"] == fake_id
