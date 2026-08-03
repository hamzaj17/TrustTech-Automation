from __future__ import annotations

from app.ai.hashtags import build_hashtags
from app.models.brand_settings import BrandSettings


def generate_caption(topic: str, brand_settings: BrandSettings) -> tuple[str, str, list[str]]:
    tone = brand_settings.writing_tone.rstrip(".")
    audience = brand_settings.target_audience.rstrip(".")
    caption = (
        f"{topic}. Built for {audience.lower()}, with a {tone.lower()} approach that keeps the process practical and easy to follow."
    )
    call_to_action = "Want a simple workflow like this? Save it and share it with your team."
    hashtags = build_hashtags(brand_settings.preferred_hashtags, topic)
    return caption, call_to_action, hashtags