from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TopicGenerateRequest(BaseModel):
    category: str | None = Field(default=None, max_length=100)


class TopicRead(BaseModel):
    id: UUID
    topic: str
    category: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CaptionGenerateRequest(BaseModel):
    topic: str = Field(min_length=1, max_length=255)


class CaptionResult(BaseModel):
    caption: str
    call_to_action: str
    hashtags: list[str] = Field(min_length=1, max_length=20)


class ImagePromptGenerateRequest(BaseModel):
    topic: str = Field(min_length=1, max_length=255)
    caption: str | None = None


class ImagePromptResult(BaseModel):
    image_prompt: str


class ImageGenerateRequest(BaseModel):
    image_prompt: str = Field(min_length=1)
    draft_id: UUID | None = None
    aspect_ratio: str | None = None


class ImageResult(BaseModel):
    image_url: str
    image_path: str
    credits_left: int | None = None


class ContentDraftRead(BaseModel):
    id: UUID
    topic: str
    caption: str | None
    call_to_action: str | None
    hashtags: list[str] | None
    image_prompt: str | None
    image_url: str | None
    image_path: str | None
    platform: str | None
    scheduled_for: datetime | None
    approved_at: datetime | None
    rejected_at: datetime | None
    published_at: datetime | None
    rejection_reason: str | None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ContentGenerateFullRequest(BaseModel):
    topic: str | None = Field(default=None, max_length=255)
    category: str | None = Field(default=None, max_length=100)


class ContentCreateRequest(BaseModel):
    topic: str = Field(min_length=1, max_length=255)
    caption: str | None = None
    call_to_action: str | None = None
    hashtags: list[str] | None = None
    image_prompt: str | None = None
    image_base64: str | None = None
    image_suffix: str | None = None
    platform: str | None = None
    scheduled_for: datetime | None = None
    publish_now: bool = Field(default=False)


class ContentRejectRequest(BaseModel):
    reason: str | None = Field(default=None, max_length=500)


class ContentScheduleRequest(BaseModel):
    platform: Literal["instagram", "facebook", "tiktok", "linkedin", "manual"]
    scheduled_for: datetime


class ContentExportRead(BaseModel):
    id: UUID
    topic: str
    platform: str | None
    status: str
    caption: str
    call_to_action: str | None
    hashtags: list[str]
    image_url: str | None
    image_path: str | None
    post_text: str
