"""
WebSocket event name and payload contracts (shared with the client).

PR-13 only establishes the connection; element sync and lock events are
added in PR-14. Keep inbound/outbound event strings centralized here.
"""


EVENT_CONNECTED = "connected"
