"""
Canvas ORM model.

Represents a single collaborative design workspace.
Each canvas is owned by one user and contains zero or more elements.
A unique share_token is auto-generated to support shareable invite URLs.
"""
import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def _generate_share_token() -> str:
    return uuid.uuid4().hex


class Canvas(Base):
    __tablename__ = "canvases"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    owner_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    share_token: Mapped[str] = mapped_column(
        String(64), unique=True, nullable=False, default=_generate_share_token
    )

    owner: Mapped["User"] = relationship("User", back_populates="canvases")
    elements: Mapped[list["Element"]] = relationship(
        "Element",
        back_populates="canvas",
        lazy="selectin",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Canvas {self.title}>"


from app.models.user import User  # noqa: E402, F401
from app.models.element import Element  # noqa: E402, F401
