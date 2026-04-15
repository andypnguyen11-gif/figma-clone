"""
Element ORM model.

Represents a single visual object on a canvas (rectangle, circle, line,
triangle, or text). Stores geometry, styling, and text-specific properties.

Styling defaults mirror a white fill with black stroke at full opacity,
matching common design tool conventions.
"""
import uuid

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Element(Base):
    __tablename__ = "elements"

    canvas_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("canvases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    element_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )

    # Geometry
    x: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    y: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    width: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    height: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Styling
    fill: Mapped[str] = mapped_column(
        String(50), nullable=False, default="#FFFFFF"
    )
    stroke: Mapped[str] = mapped_column(
        String(50), nullable=False, default="#000000"
    )
    stroke_width: Mapped[float] = mapped_column(
        Float, nullable=False, default=1.0
    )
    opacity: Mapped[float] = mapped_column(
        Float, nullable=False, default=1.0
    )
    rotation: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0
    )
    z_index: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )

    # Text-specific (nullable — only populated for text elements)
    text_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    font_size: Mapped[float | None] = mapped_column(Float, nullable=True)
    text_color: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )

    canvas: Mapped["Canvas"] = relationship("Canvas", back_populates="elements")

    def __repr__(self) -> str:
        return f"<Element {self.element_type} @ ({self.x}, {self.y})>"


from app.models.canvas import Canvas  # noqa: E402, F401
