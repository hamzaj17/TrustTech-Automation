"""create initial tables

Revision ID: 20260731_0001
Revises:
Create Date: 2026-07-31
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260731_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "ai_generation_logs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("generation_type", sa.String(length=100), nullable=False),
        sa.Column("provider", sa.String(length=100), nullable=False),
        sa.Column("model", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_ai_generation_logs_generation_type"),
        "ai_generation_logs",
        ["generation_type"],
        unique=False,
    )

    op.create_table(
        "brand_settings",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("company_name", sa.String(length=255), nullable=False),
        sa.Column("primary_color", sa.String(length=20), nullable=False),
        sa.Column("secondary_color", sa.String(length=20), nullable=False),
        sa.Column("accent_color", sa.String(length=20), nullable=False),
        sa.Column("writing_tone", sa.String(length=500), nullable=False),
        sa.Column("target_audience", sa.String(length=500), nullable=False),
        sa.Column("website", sa.String(length=500), nullable=False),
        sa.Column("logo_url", sa.String(length=500), nullable=True),
        sa.Column("preferred_hashtags", sa.JSON(), nullable=False),
        sa.Column("posting_interval_minutes", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "content_drafts",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("topic", sa.String(length=255), nullable=False),
        sa.Column("caption", sa.Text(), nullable=True),
        sa.Column("call_to_action", sa.String(length=500), nullable=True),
        sa.Column("hashtags", sa.JSON(), nullable=True),
        sa.Column("image_prompt", sa.Text(), nullable=True),
        sa.Column("image_url", sa.String(length=1000), nullable=True),
        sa.Column("image_path", sa.String(length=1000), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_content_drafts_status"), "content_drafts", ["status"], unique=False)
    op.create_index(op.f("ix_content_drafts_topic"), "content_drafts", ["topic"], unique=False)

    op.create_table(
        "generated_topics",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("topic", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_generated_topics_topic"),
        "generated_topics",
        ["topic"],
        unique=False,
    )

    op.create_table(
        "scheduler_jobs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("job_type", sa.String(length=100), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False),
        sa.Column("max_attempts", sa.Integer(), nullable=False),
        sa.Column("scheduled_for", sa.DateTime(timezone=True), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("result", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_scheduler_jobs_job_type"), "scheduler_jobs", ["job_type"], unique=False)
    op.create_index(op.f("ix_scheduler_jobs_status"), "scheduler_jobs", ["status"], unique=False)

    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=True),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
    op.drop_index(op.f("ix_scheduler_jobs_status"), table_name="scheduler_jobs")
    op.drop_index(op.f("ix_scheduler_jobs_job_type"), table_name="scheduler_jobs")
    op.drop_table("scheduler_jobs")
    op.drop_index(op.f("ix_generated_topics_topic"), table_name="generated_topics")
    op.drop_table("generated_topics")
    op.drop_index(op.f("ix_content_drafts_topic"), table_name="content_drafts")
    op.drop_index(op.f("ix_content_drafts_status"), table_name="content_drafts")
    op.drop_table("content_drafts")
    op.drop_table("brand_settings")
    op.drop_index(op.f("ix_ai_generation_logs_generation_type"), table_name="ai_generation_logs")
    op.drop_table("ai_generation_logs")
