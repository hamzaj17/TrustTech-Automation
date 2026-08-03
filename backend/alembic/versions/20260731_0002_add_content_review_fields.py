"""add content review fields

Revision ID: 20260731_0002
Revises: 20260731_0001
Create Date: 2026-07-31
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260731_0002"
down_revision: str | None = "20260731_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("content_drafts", sa.Column("platform", sa.String(length=50), nullable=True))
    op.add_column("content_drafts", sa.Column("scheduled_for", sa.DateTime(timezone=True), nullable=True))
    op.add_column("content_drafts", sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("content_drafts", sa.Column("rejected_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("content_drafts", sa.Column("published_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("content_drafts", sa.Column("rejection_reason", sa.String(length=500), nullable=True))
    op.create_index(op.f("ix_content_drafts_platform"), "content_drafts", ["platform"], unique=False)
    op.create_index(op.f("ix_content_drafts_scheduled_for"), "content_drafts", ["scheduled_for"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_content_drafts_scheduled_for"), table_name="content_drafts")
    op.drop_index(op.f("ix_content_drafts_platform"), table_name="content_drafts")
    op.drop_column("content_drafts", "rejection_reason")
    op.drop_column("content_drafts", "published_at")
    op.drop_column("content_drafts", "rejected_at")
    op.drop_column("content_drafts", "approved_at")
    op.drop_column("content_drafts", "scheduled_for")
    op.drop_column("content_drafts", "platform")
