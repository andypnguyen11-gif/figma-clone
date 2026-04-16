"""
WebSocket route registration for canvas collaboration channels.

Handshake: ``GET /api/canvas/{canvas_id}/ws?token=<JWT>`` — the token is
validated before ``accept()``; invalid or missing tokens result in a
close frame (code 1008) without upgrading the connection.

After the initial ``connected`` / ``room:peers`` frames, clients may send
JSON with ``event`` set to ``lock:acquire``, ``lock:release``, or
``lock:heartbeat`` (``element_id`` UUID). Element CRUD continues to use REST;
the server broadcasts resulting ``element:*`` events to the room.
"""

from __future__ import annotations

import json
import uuid

from fastapi import APIRouter, Depends, HTTPException, WebSocket, status
from sqlalchemy.orm import Session
from starlette.websockets import WebSocketDisconnect

from app.db.session import get_db
from app.models.element import Element
from app.redis.client import get_redis
from app.services.canvas_service import get_canvas
from app.services import lock_service as lock_svc
from app.websocket import ws_auth
from app.websocket.events import (
    EVENT_LOCK_ACQUIRE,
    EVENT_LOCK_DENIED,
    EVENT_LOCK_HEARTBEAT,
    EVENT_LOCK_RELEASE,
    EVENT_CONNECTED,
    EVENT_ROOM_PEERS,
)
from app.websocket.manager import connection_manager

router = APIRouter(prefix="/canvas", tags=["websocket"])


async def _broadcast_room_peer_count(canvas_id: uuid.UUID) -> None:
    """Notify everyone in the room (possibly empty) after join or leave."""
    payload = {
        "event": EVENT_ROOM_PEERS,
        "canvas_id": str(canvas_id),
        "peer_count": connection_manager.connection_count(canvas_id),
    }
    await connection_manager.broadcast_json(canvas_id, payload)


def _validate_element_id(canvas_id: uuid.UUID, element_id: uuid.UUID, db: Session) -> bool:
    exists = (
        db.query(Element.id)
        .filter(Element.id == element_id, Element.canvas_id == canvas_id)
        .first()
    )
    return exists is not None


@router.websocket("/{canvas_id}/ws")
async def canvas_collaboration_socket(
    websocket: WebSocket,
    canvas_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> None:
    """Authenticated web-socket endpoint for a canvas document."""
    token = websocket.query_params.get("token")
    try:
        user = ws_auth.require_ws_user(token, db)
    except ws_auth.WebSocketAuthError:
        await websocket.close(code=1008)
        return

    try:
        get_canvas(canvas_id, db)
    except HTTPException as exc:
        if exc.status_code == status.HTTP_404_NOT_FOUND:
            await websocket.close(code=1008)
            return
        raise

    await websocket.accept()
    redis_client = get_redis()
    connection_manager.register(canvas_id, websocket)
    try:
        await websocket.send_json(
            {"event": EVENT_CONNECTED, "canvas_id": str(canvas_id)}
        )
        await _broadcast_room_peer_count(canvas_id)
        while True:
            try:
                raw = await websocket.receive_text()
                msg = json.loads(raw)
            except WebSocketDisconnect:
                raise
            except (json.JSONDecodeError, TypeError, ValueError):
                continue

            event = msg.get("event")
            element_raw = msg.get("element_id")
            if not isinstance(event, str) or not isinstance(element_raw, str):
                continue
            try:
                element_id = uuid.UUID(element_raw)
            except (ValueError, TypeError):
                continue

            if not _validate_element_id(canvas_id, element_id, db):
                await websocket.send_json(
                    {"event": EVENT_LOCK_DENIED, "element_id": str(element_id)}
                )
                continue

            if event == EVENT_LOCK_ACQUIRE:
                ok = lock_svc.handle_lock_acquire(
                    redis_client, canvas_id, element_id, user
                )
                if ok:
                    payload = lock_svc.lock_broadcast_payload(
                        user, canvas_id, element_id
                    )
                    await connection_manager.broadcast_json(canvas_id, payload)
                else:
                    await websocket.send_json(
                        {"event": EVENT_LOCK_DENIED, "element_id": str(element_id)}
                    )
            elif event == EVENT_LOCK_RELEASE:
                removed = lock_svc.handle_lock_release(
                    redis_client, canvas_id, element_id, user
                )
                if removed:
                    await connection_manager.broadcast_json(
                        canvas_id,
                        lock_svc.lock_release_broadcast_payload(
                            canvas_id, element_id
                        ),
                    )
            elif event == EVENT_LOCK_HEARTBEAT:
                lock_svc.handle_lock_heartbeat(
                    redis_client, canvas_id, element_id, user
                )
    except WebSocketDisconnect:
        pass
    finally:
        pairs = lock_svc.release_all_tracked_for_user(redis_client, user.id)
        connection_manager.unregister(canvas_id, websocket)
        for c_id, e_id in pairs:
            await connection_manager.broadcast_json(
                c_id,
                lock_svc.lock_release_broadcast_payload(c_id, e_id),
            )
        await _broadcast_room_peer_count(canvas_id)
