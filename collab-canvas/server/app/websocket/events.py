"""
WebSocket event name and payload contracts (shared with the client).

PR-13 only establishes the connection; element sync and lock events are
added in PR-14. Keep inbound/outbound event strings centralized here.
"""


EVENT_CONNECTED = "connected"

# Broadcast to all sockets in a canvas room after connect/disconnect so clients
# can show collaboration UI only when peer_count > 1.
EVENT_ROOM_PEERS = "room:peers"

EVENT_ELEMENT_CREATED = "element:created"
EVENT_ELEMENT_UPDATED = "element:updated"
EVENT_ELEMENT_DELETED = "element:deleted"

EVENT_LOCK_ACQUIRE = "lock:acquire"
EVENT_LOCK_RELEASE = "lock:release"
EVENT_LOCK_DENIED = "lock:denied"
EVENT_LOCK_HEARTBEAT = "lock:heartbeat"
# Sent to a socket right after join so reconnecting clients can rebuild lock overlays.
EVENT_LOCK_SNAPSHOT = "lock:snapshot"

# Cursor presence (PR-15): client sends coordinates; server stores in Redis + broadcasts.
EVENT_CURSOR_MOVE = "cursor:move"
EVENT_USER_LEFT = "user:left"
