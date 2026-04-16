"""Deterministic accent colour per user for lock overlays."""

from __future__ import annotations

import hashlib
import uuid


def user_color_hex(user_id: uuid.UUID) -> str:
    """Stable saturated hex colour derived from ``user_id``."""
    digest = hashlib.sha256(str(user_id).encode()).hexdigest()
    r = int(digest[0:2], 16)
    g = int(digest[2:4], 16)
    b = int(digest[4:6], 16)
    return f"#{r:02x}{g:02x}{b:02x}"
