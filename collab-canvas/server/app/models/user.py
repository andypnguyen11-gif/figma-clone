"""
User ORM model.

Stores authentication credentials and display identity.
Email is the unique login identifier; hashed_password is never exposed via API.
"""
import uuid

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    hashed_password: Mapped[str] = mapped_column(
        String(255), nullable=False
    )
    display_name: Mapped[str] = mapped_column(
        String(100), nullable=False
    )

    canvases: Mapped[list["Canvas"]] = relationship(
        "Canvas", back_populates="owner", lazy="selectin"
    )
    canvas_memberships: Mapped[list["CanvasMembership"]] = relationship(
        "CanvasMembership",
        back_populates="user",
        lazy="selectin",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<User {self.email}>"


# Avoid circular import — Canvas is resolved by string reference above.
from app.models.canvas import Canvas  # noqa: E402, F401
