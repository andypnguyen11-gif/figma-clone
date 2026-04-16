"""
WebSocket route registration for canvas collaboration channels.

Handshake: ``GET /api/canvas/{canvas_id}/ws?token=<JWT>`` — the token is
validated before ``accept()``; invalid or missing tokens result in a
close frame (code 1008) without upgrading the connection.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, WebSocket, status
from sqlalchemy.orm import Session
from starlette.websockets import WebSocketDisconnect

from app.db.session import get_db
from app.services.canvas_service import get_canvas
from app.websocket import ws_auth
from app.websocket.events import EVENT_CONNECTED
from app.websocket.manager import connection_manager

router = APIRouter(prefix="/canvas", tags=["websocket"])


@router.websocket("/{canvas_id}/ws")
async def canvas_collaboration_socket(
    websocket: WebSocket,
    canvas_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> None:
    """Authenticated web-socket endpoint for a canvas document."""
    token = websocket.query_params.get("token")
    try:
        ws_auth.require_ws_user(token, db)
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
    connection_manager.register(canvas_id, websocket)
    try:
        await websocket.send_json(
            {"event": EVENT_CONNECTED, "canvas_id": str(canvas_id)}
        )
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        connection_manager.unregister(canvas_id, websocket)
