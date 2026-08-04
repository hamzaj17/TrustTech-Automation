from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.ai.content_engine import (
    build_full_content,
    generate_caption_bundle,
    generate_image_asset,
    generate_image_prompt_text,
    generate_topic_draft,
    create_content_draft_full,
    get_content_draft,
    approve_content_draft,
    export_content_draft,
    list_content_drafts,
    mock_publish_content_draft,
    reject_content_draft,
    schedule_content_draft,
)
from app.auth.dependencies import require_admin
from app.database.session import get_db
from app.models.content import ContentDraft, GeneratedTopic
from app.models.user import User
from app.schemas.content import (
    CaptionGenerateRequest,
    CaptionResult,
    ContentExportRead,
    ContentDraftRead,
    ContentGenerateFullRequest,
    ContentRejectRequest,
    ContentScheduleRequest,
    ImageGenerateRequest,
    ImagePromptGenerateRequest,
    ImagePromptResult,
    ImageResult,
    ContentCreateRequest,
    TopicGenerateRequest,
    TopicRead,
)

router = APIRouter()


@router.post("/topics/generate", response_model=TopicRead)
def generate_topic_endpoint(
    payload: TopicGenerateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> GeneratedTopic:
    return generate_topic_draft(db, payload.category)


@router.post("/captions/generate", response_model=CaptionResult)
def generate_caption_endpoint(
    payload: CaptionGenerateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> CaptionResult:
    bundle = generate_caption_bundle(db, payload.topic)
    return CaptionResult(
        caption=bundle.caption,
        call_to_action=bundle.call_to_action,
        hashtags=bundle.hashtags,
    )


@router.post("/image-prompts/generate", response_model=ImagePromptResult)
def generate_image_prompt_endpoint(
    payload: ImagePromptGenerateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> ImagePromptResult:
    caption_text = payload.caption or payload.topic
    return ImagePromptResult(
        image_prompt=generate_image_prompt_text(db, payload.topic, caption_text),
    )


@router.post("/images/generate", response_model=ImageResult)
def generate_image_endpoint(
    payload: ImageGenerateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> ImageResult:
    draft = None
    if payload.draft_id is not None:
        draft = get_content_draft(db, str(payload.draft_id))
    # Pass aspect_ratio through; generate_image_asset now returns credits_left as third value
    image_url, image_path, credits_left = generate_image_asset(db, payload.image_prompt, draft, payload.aspect_ratio)
    return ImageResult(image_url=image_url, image_path=image_path, credits_left=credits_left)


@router.post("/content", response_model=ContentDraftRead)
def create_content_endpoint(
    payload: ContentCreateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> ContentDraft:
    # Delegate to content engine to create and persist the draft
    return create_content_draft_full(db, payload)


@router.post("/content/generate-full", response_model=ContentDraftRead)
def generate_full_content_endpoint(
    payload: ContentGenerateFullRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> ContentDraft:
    return build_full_content(db, payload.topic, payload.category)


@router.get("/content", response_model=list[ContentDraftRead])
def list_content_endpoint(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[ContentDraft]:
    return list_content_drafts(db)


@router.get("/content/{draft_id}", response_model=ContentDraftRead)
def get_content_endpoint(
    draft_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> ContentDraft:
    return get_content_draft(db, draft_id)


@router.post("/content/{draft_id}/approve", response_model=ContentDraftRead)
def approve_content_endpoint(
    draft_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> ContentDraft:
    return approve_content_draft(db, draft_id)


@router.post("/content/{draft_id}/reject", response_model=ContentDraftRead)
def reject_content_endpoint(
    draft_id: str,
    payload: ContentRejectRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> ContentDraft:
    return reject_content_draft(db, draft_id, payload.reason)


@router.post("/content/{draft_id}/schedule", response_model=ContentDraftRead)
def schedule_content_endpoint(
    draft_id: str,
    payload: ContentScheduleRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> ContentDraft:
    return schedule_content_draft(db, draft_id, payload.platform, payload.scheduled_for)


@router.post("/content/{draft_id}/publish-mock", response_model=ContentDraftRead)
def mock_publish_content_endpoint(
    draft_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> ContentDraft:
    return mock_publish_content_draft(db, draft_id)


@router.get("/content/{draft_id}/export", response_model=ContentExportRead)
def export_content_endpoint(
    draft_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> ContentExportRead:
    return export_content_draft(db, draft_id)
