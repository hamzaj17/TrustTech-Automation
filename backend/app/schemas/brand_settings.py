from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class BrandSettingsBase(BaseModel):
    company_name: str = Field(min_length=1, max_length=255)
    primary_color: str = Field(pattern=r"^#[0-9A-Fa-f]{6}$")
    secondary_color: str = Field(pattern=r"^#[0-9A-Fa-f]{6}$")
    accent_color: str = Field(pattern=r"^#[0-9A-Fa-f]{6}$")
    writing_tone: str = Field(min_length=1, max_length=500)
    target_audience: str = Field(min_length=1, max_length=500)
    website: HttpUrl
    logo_url: HttpUrl | None = None
    preferred_hashtags: list[str] = Field(min_length=1, max_length=20)
    posting_interval_minutes: int = Field(ge=15, le=10080)


class BrandSettingsUpdate(BaseModel):
    company_name: str | None = Field(default=None, min_length=1, max_length=255)
    primary_color: str | None = Field(default=None, pattern=r"^#[0-9A-Fa-f]{6}$")
    secondary_color: str | None = Field(default=None, pattern=r"^#[0-9A-Fa-f]{6}$")
    accent_color: str | None = Field(default=None, pattern=r"^#[0-9A-Fa-f]{6}$")
    writing_tone: str | None = Field(default=None, min_length=1, max_length=500)
    target_audience: str | None = Field(default=None, min_length=1, max_length=500)
    website: HttpUrl | None = None
    logo_url: HttpUrl | None = None
    preferred_hashtags: list[str] | None = Field(default=None, min_length=1, max_length=20)
    posting_interval_minutes: int | None = Field(default=None, ge=15, le=10080)


class BrandSettingsRead(BrandSettingsBase):
    id: UUID

    model_config = ConfigDict(from_attributes=True)
