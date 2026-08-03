from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.session import Base


class BrandSettings(Base):
    __tablename__ = "brand_settings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    primary_color: Mapped[str] = mapped_column(String(20), nullable=False)
    secondary_color: Mapped[str] = mapped_column(String(20), nullable=False)
    accent_color: Mapped[str] = mapped_column(String(20), nullable=False)
    writing_tone: Mapped[str] = mapped_column(String(500), nullable=False)
    target_audience: Mapped[str] = mapped_column(String(500), nullable=False)
    website: Mapped[str] = mapped_column(String(500), nullable=False)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    preferred_hashtags: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    posting_interval_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
