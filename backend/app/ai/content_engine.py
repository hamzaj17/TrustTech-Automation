from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Literal

import requests
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.ai.captions import generate_caption
from app.ai.hashtags import build_hashtags
from app.ai.images import decode_base64_image, generate_mock_image
from app.ai.prompts import generate_image_prompt
from app.ai.topics import generate_topic
from app.core.config import settings
from app.models.brand_settings import BrandSettings
from app.models.content import AIGenerationLog, ContentDraft, GeneratedTopic
from app.schemas.content import ContentExportRead
from app.social.publisher import publish_draft


GenerationStatus = Literal["success", "failure"]


@dataclass(frozen=True)
class CaptionBundle:
    caption: str
    call_to_action: str
    hashtags: list[str]


def _log_generation(
    db: Session,
    generation_type: str,
    provider: str,
    model: str,
    status: GenerationStatus,
    error_message: str | None = None,
    metadata: dict | None = None,
) -> None:
    db.add(
        AIGenerationLog(
            generation_type=generation_type,
            provider=provider,
            model=model,
            status=status,
            error_message=error_message,
            metadata_json=metadata,
        )
    )
    db.commit()


def _brand_settings_row(db: Session) -> BrandSettings:
    brand_settings = db.query(BrandSettings).first()
    if brand_settings is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Brand settings must be configured before generating AI content.",
        )
    return brand_settings


def _use_live_text_generation() -> bool:
    return settings.ai_generation_mode.lower() == "live" and bool(settings.groq_api_key)


def _raise_live_generation_error(provider: str, operation: str, exc: Exception) -> None:
    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail=f"{provider} {operation} failed: {exc}",
    ) from exc


def _groq_json_response(prompt: str, schema_name: str, schema: dict, model: str) -> dict:
    if not settings.groq_api_key:
        raise RuntimeError("Groq API key is missing.")

    schema_text = json.dumps(schema, separators=(",", ":"))
    structured_prompt = (
        f"{prompt}\n\n"
        f"Return only valid JSON for {schema_name}. "
        f"The JSON must match this schema exactly: {schema_text}"
    )

    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {settings.groq_api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": "You generate concise, structured marketing content for a technology brand.",
                },
                {"role": "user", "content": structured_prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.7,
            "stream": False,
            "top_p": 1,
            "max_tokens": 1024,
            "user": schema_name,
        },
        timeout=60,
    )
    response.raise_for_status()
    payload = response.json()
    choices = payload.get("choices", [])
    if not choices:
        raise RuntimeError("Groq response did not contain any choices.")

    message = choices[0].get("message", {})
    content = message.get("content")
    if not content:
        raise RuntimeError("Groq response did not contain structured text output.")

    if isinstance(content, list):
        content_text = "".join(str(item.get("text", "")) for item in content if isinstance(item, dict))
    else:
        content_text = str(content)

    return json.loads(content_text)


def _stability_image_response(image_prompt: str, model: str) -> tuple[str, str]:
    if not settings.stability_api_key:
        raise RuntimeError("Stability API key is missing.")

    endpoint = {
        "stable-image-ultra": "https://api.stability.ai/v2beta/stable-image/generate/ultra",
        "stable-image-core": "https://api.stability.ai/v2beta/stable-image/generate/core",
        "sd3.5-large": "https://api.stability.ai/v2beta/stable-image/generate/sd3",
        "sd3.5-large-turbo": "https://api.stability.ai/v2beta/stable-image/generate/sd3",
        "sd3.5-medium": "https://api.stability.ai/v2beta/stable-image/generate/sd3",
        "sd3.5-flash": "https://api.stability.ai/v2beta/stable-image/generate/sd3",
    }.get(model, "https://api.stability.ai/v2beta/stable-image/generate/core")

    stability_data = {"prompt": image_prompt, "output_format": "png"}
    if model == "stable-image-ultra":
        stability_data["aspect_ratio"] = "1:1"

    response = requests.post(
        endpoint,
        headers={
            "authorization": f"Bearer {settings.stability_api_key}",
            "accept": "image/*",
        },
        files={"none": ""},
        data=stability_data,
        timeout=120,
    )
    if response.status_code != 200:
        try:
            error_payload = response.json()
        except Exception:
            error_payload = response.text
        raise RuntimeError(f"Stability API returned {response.status_code}: {error_payload}")

    return decode_base64_image(response.content)


def generate_topic_draft(db: Session, category: str | None) -> GeneratedTopic:
    brand_settings = _brand_settings_row(db)
    if _use_live_text_generation():
        try:
            payload = _groq_json_response(
                (
                    "Generate one fresh technology topic for a social media post. "
                    f"Avoid recent duplicates. Brand audience: {brand_settings.target_audience}. "
                    f"Category: {category or 'technology'}. Return JSON with keys topic and category."
                ),
                schema_name="topic_generation",
                schema={
                    "type": "object",
                    "properties": {
                        "topic": {"type": "string"},
                        "category": {"type": ["string", "null"]},
                    },
                    "required": ["topic", "category"],
                    "additionalProperties": False,
                },
                model=settings.groq_text_model,
            )
            topic_text = str(payload.get("topic", "")).strip()
            if not topic_text:
                raise RuntimeError("Groq response did not include a topic.")

            generated_topic = GeneratedTopic(topic=topic_text, category=payload.get("category") or category)
            db.add(generated_topic)
            db.commit()
            db.refresh(generated_topic)
            _log_generation(
                db,
                generation_type="topic",
                provider="groq",
                model=settings.groq_text_model,
                status="success",
                metadata={"category": category, "topic": generated_topic.topic},
            )
            return generated_topic
        except Exception as exc:
            _raise_live_generation_error("Groq", "topic generation", exc)

    topic = generate_topic(db, category, brand_settings)
    _log_generation(
        db,
        generation_type="topic",
        provider="mock",
        model="deterministic-topic-library",
        status="success",
        metadata={"category": category, "topic": topic.topic},
    )
    return topic


def generate_caption_bundle(db: Session, topic: str) -> CaptionBundle:
    brand_settings = _brand_settings_row(db)
    if _use_live_text_generation():
        try:
            payload = _groq_json_response(
                (
                    "Create a social caption, call to action, and hashtag list for this topic. "
                    f"Topic: {topic}. Tone: {brand_settings.writing_tone}. Audience: {brand_settings.target_audience}."
                ),
                schema_name="caption_generation",
                schema={
                    "type": "object",
                    "properties": {
                        "caption": {"type": "string"},
                        "call_to_action": {"type": "string"},
                        "hashtags": {
                            "type": "array",
                            "items": {"type": "string"},
                            "minItems": 1,
                            "maxItems": 20,
                        },
                    },
                    "required": ["caption", "call_to_action", "hashtags"],
                    "additionalProperties": False,
                },
                model=settings.groq_text_model,
            )
            caption = str(payload.get("caption", "")).strip()
            call_to_action = str(payload.get("call_to_action", "")).strip()
            hashtags = build_hashtags(payload.get("hashtags", []), topic)
            if caption and call_to_action and hashtags:
                _log_generation(
                    db,
                    generation_type="caption",
                        provider="groq",
                        model=settings.groq_text_model,
                    status="success",
                    metadata={"topic": topic},
                )
                return CaptionBundle(caption=caption, call_to_action=call_to_action, hashtags=hashtags)
        except Exception as exc:
                    _raise_live_generation_error("Groq", "caption generation", exc)

    caption, call_to_action, hashtags = generate_caption(topic, brand_settings)
    _log_generation(
        db,
        generation_type="caption",
        provider="mock",
        model="deterministic-caption-template",
        status="success",
        metadata={"topic": topic},
    )
    return CaptionBundle(caption=caption, call_to_action=call_to_action, hashtags=hashtags)


def generate_image_prompt_text(db: Session, topic: str, caption: str) -> str:
    brand_settings = _brand_settings_row(db)
    if _use_live_text_generation():
        try:
            payload = _groq_json_response(
                (
                    "Create a detailed image prompt for a marketing visual. "
                    f"Topic: {topic}. Caption: {caption}. Brand colors: {brand_settings.primary_color}, "
                    f"{brand_settings.secondary_color}, {brand_settings.accent_color}."
                ),
                schema_name="image_prompt_generation",
                schema={
                    "type": "object",
                    "properties": {"image_prompt": {"type": "string"}},
                    "required": ["image_prompt"],
                    "additionalProperties": False,
                },
                model=settings.groq_text_model,
            )
            image_prompt = str(payload.get("image_prompt", "")).strip()
            if image_prompt:
                _log_generation(
                    db,
                    generation_type="image_prompt",
                        provider="groq",
                        model=settings.groq_text_model,
                    status="success",
                    metadata={"topic": topic},
                )
                return image_prompt
        except Exception as exc:
                    _raise_live_generation_error("Groq", "image prompt generation", exc)

    image_prompt = generate_image_prompt(topic, caption, brand_settings)
    _log_generation(
        db,
        generation_type="image_prompt",
        provider="mock",
        model="deterministic-prompt-template",
        status="success",
        metadata={"topic": topic},
    )
    return image_prompt


def generate_image_asset(db: Session, image_prompt: str, draft: ContentDraft | None = None) -> tuple[str, str]:
    provider = "mock"
    model = "svg-placeholder"
    try:
        if settings.ai_generation_mode.lower() == "live" and settings.stability_api_key:
            provider = "stability"
            model = settings.stability_image_model.strip() or "stable-image-core"
            image_url, image_path = _stability_image_response(image_prompt, model)
        else:
            image_url, image_path = generate_mock_image(image_prompt)
    except Exception as exc:
        if settings.ai_generation_mode.lower() == "live" and settings.stability_api_key:
            _raise_live_generation_error("Stability", "image generation", exc)
        provider = "mock"
        model = "svg-placeholder"
        image_url, image_path = generate_mock_image(image_prompt)

    try:
        if draft is not None:
            draft.image_prompt = image_prompt
            draft.image_url = image_url
            draft.image_path = image_path
            draft.status = "ready"
            db.add(draft)
            db.commit()
            db.refresh(draft)

        _log_generation(
            db,
            generation_type="image",
            provider=provider,
            model=model,
            status="success",
            metadata={"image_prompt": image_prompt},
        )
        return image_url, image_path
    except Exception as exc:
        if draft is not None:
            draft.status = "failed"
            draft.image_prompt = image_prompt
            db.add(draft)
            db.commit()
            db.refresh(draft)
        _log_generation(
            db,
            generation_type="image",
            provider=provider,
            model=model,
            status="failure",
            error_message=str(exc),
            metadata={"image_prompt": image_prompt},
        )
        raise


def list_content_drafts(db: Session) -> list[ContentDraft]:
    return db.query(ContentDraft).order_by(ContentDraft.created_at.desc()).all()


def get_content_draft(db: Session, draft_id: str) -> ContentDraft:
    draft = db.get(ContentDraft, draft_id)
    if draft is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content draft not found.")
    return draft


def ensure_topic_record(db: Session, topic: str, category: str | None) -> GeneratedTopic:
    existing_topic = db.query(GeneratedTopic).filter(GeneratedTopic.topic == topic).first()
    if existing_topic is not None:
        return existing_topic

    topic_row = GeneratedTopic(topic=topic, category=category)
    db.add(topic_row)
    db.commit()
    db.refresh(topic_row)
    return topic_row


def create_content_draft(
    db: Session,
    topic: str,
    caption: str,
    call_to_action: str,
    hashtags: list[str],
    image_prompt: str,
) -> ContentDraft:
    draft = ContentDraft(
        topic=topic,
        caption=caption,
        call_to_action=call_to_action,
        hashtags=hashtags,
        image_prompt=image_prompt,
        status="draft",
    )
    db.add(draft)
    db.commit()
    db.refresh(draft)
    return draft


def build_full_content(db: Session, topic: str | None, category: str | None) -> ContentDraft:
    _brand_settings_row(db)
    topic_row = ensure_topic_record(db, topic, category) if topic else generate_topic_draft(db, category)
    caption_bundle = generate_caption_bundle(db, topic_row.topic)
    image_prompt = generate_image_prompt_text(db, topic_row.topic, caption_bundle.caption)

    draft = create_content_draft(
        db,
        topic=topic_row.topic,
        caption=caption_bundle.caption,
        call_to_action=caption_bundle.call_to_action,
        hashtags=caption_bundle.hashtags,
        image_prompt=image_prompt,
    )
    generate_image_asset(db, image_prompt, draft)
    _log_generation(
        db,
        generation_type="content_full",
        provider="pipeline",
        model=f"{settings.groq_text_model} + {settings.stability_image_model}",
        status="success",
        metadata={"topic": topic_row.topic},
    )
    return draft


def approve_content_draft(db: Session, draft_id: str) -> ContentDraft:
    draft = get_content_draft(db, draft_id)
    draft.status = "approved"
    draft.approved_at = datetime.now(timezone.utc)
    draft.rejected_at = None
    draft.rejection_reason = None
    db.add(draft)
    db.commit()
    db.refresh(draft)
    return draft


def reject_content_draft(db: Session, draft_id: str, reason: str | None = None) -> ContentDraft:
    draft = get_content_draft(db, draft_id)
    draft.status = "rejected"
    draft.rejected_at = datetime.now(timezone.utc)
    draft.rejection_reason = reason
    db.add(draft)
    db.commit()
    db.refresh(draft)
    return draft


def schedule_content_draft(
    db: Session,
    draft_id: str,
    platform: str,
    scheduled_for: datetime,
) -> ContentDraft:
    draft = get_content_draft(db, draft_id)
    if draft.status not in {"ready", "approved", "scheduled"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only ready, approved, or scheduled drafts can be scheduled.",
        )

    draft.status = "scheduled"
    draft.platform = platform
    draft.scheduled_for = scheduled_for
    if draft.approved_at is None:
        draft.approved_at = datetime.now(timezone.utc)
    db.add(draft)
    db.commit()
    db.refresh(draft)
    return draft


def mock_publish_content_draft(db: Session, draft_id: str) -> ContentDraft:
    draft = get_content_draft(db, draft_id)
    if draft.status not in {"ready", "approved", "scheduled"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only ready, approved, or scheduled drafts can be published.",
        )

    try:
        result = publish_draft(draft)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Social publishing failed: {exc}",
        ) from exc

    draft.status = "published" if result["mode"] == "real" else "published_mock"
    draft.published_at = datetime.now(timezone.utc)
    db.add(draft)
    db.commit()
    db.refresh(draft)
    return draft


def export_content_draft(db: Session, draft_id: str) -> ContentExportRead:
    draft = get_content_draft(db, draft_id)
    hashtags = draft.hashtags or []
    caption = draft.caption or ""
    hashtag_text = " ".join(hashtags)
    post_parts = [part for part in [caption, draft.call_to_action, hashtag_text] if part]

    return ContentExportRead(
        id=draft.id,
        topic=draft.topic,
        platform=draft.platform,
        status=draft.status,
        caption=caption,
        call_to_action=draft.call_to_action,
        hashtags=hashtags,
        image_url=draft.image_url,
        image_path=draft.image_path,
        post_text="\n\n".join(post_parts),
    )
