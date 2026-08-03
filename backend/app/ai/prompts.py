from __future__ import annotations

from app.models.brand_settings import BrandSettings


def generate_image_prompt(topic: str, caption: str, brand_settings: BrandSettings) -> str:
    return (
        f"Create a polished social media image for a technology brand. Topic: {topic}. "
        f"Caption context: {caption}. "
        f"Use the brand colors {brand_settings.primary_color}, {brand_settings.secondary_color}, and {brand_settings.accent_color}. "
        f"Style: modern, clean, high-contrast, professional, with clear visual hierarchy and subtle tech-inspired details. "
        f"The composition should feel premium, accessible, and optimized for a marketing post."
    )