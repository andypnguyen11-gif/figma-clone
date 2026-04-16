"""add canvas_memberships table

Revision ID: b2c4d6e8f0a1
Revises: 9e939e8b749c
Create Date: 2026-04-16

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b2c4d6e8f0a1"
down_revision: Union[str, Sequence[str], None] = "9e939e8b749c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "canvas_memberships",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("canvas_id", sa.Uuid(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["canvas_id"], ["canvases.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "canvas_id", name="uq_canvas_memberships_user_canvas"),
    )
    op.create_index(
        op.f("ix_canvas_memberships_canvas_id"),
        "canvas_memberships",
        ["canvas_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_canvas_memberships_user_id"),
        "canvas_memberships",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_canvas_memberships_user_id"), table_name="canvas_memberships")
    op.drop_index(op.f("ix_canvas_memberships_canvas_id"), table_name="canvas_memberships")
    op.drop_table("canvas_memberships")
