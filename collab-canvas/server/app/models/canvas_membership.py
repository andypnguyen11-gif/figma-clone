"""
Canvas membership — records that a user joined a canvas via share link.

Used to show collaborator canvases on the dashboard alongside owned canvases.
Owners do not get a row here (their access is via Canvas.owner_id).
"""
from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class CanvasMembership(Base):
    """Links a user to a canvas they joined (not the owner)."""

    __tablename__ = "canvas_memberships"
    __table_args__ = (
        UniqueConstraint("user_id", "canvas_id", name="uq_canvas_memberships_user_canvas"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    canvas_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("canvases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    user: Mapped["User"] = relationship("User", back_populates="canvas_memberships")
    canvas: Mapped["Canvas"] = relationship("Canvas", back_populates="memberships")
