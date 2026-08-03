from __future__ import annotations

import requests

from app.core.config import settings
from app.models.content import ContentDraft


def publish_draft(draft: ContentDraft) -> dict[str, object]:
    platforms = _platforms_for_draft(draft)
    if settings.social_publish_mode.lower() != "real":
        return {
            "mode": "mock",
            "platforms": platforms,
            "published": [{"platform": platform, "external_id": "mock"} for platform in platforms],
        }

    published = []
    for platform in platforms:
        if platform == "facebook":
            published.append(_publish_facebook(draft))
        elif platform == "instagram":
            published.append(_publish_instagram(draft))
        elif platform == "tiktok":
            published.append(_publish_tiktok(draft))
        else:
            raise RuntimeError(f"Unsupported real publishing platform: {platform}")

    return {"mode": "real", "platforms": platforms, "published": published}


def _platforms_for_draft(draft: ContentDraft) -> list[str]:
    value = draft.platform or settings.auto_publish_platforms or "manual"
    return [platform.strip().lower() for platform in value.split(",") if platform.strip()]


def _post_text(draft: ContentDraft) -> str:
    hashtags = " ".join(draft.hashtags or [])
    return "\n\n".join(part for part in [draft.caption, draft.call_to_action, hashtags] if part)


def _publish_facebook(draft: ContentDraft) -> dict[str, str]:
    if not settings.facebook_page_id or not settings.facebook_page_access_token:
        raise RuntimeError("FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN are required.")

    base_url = f"https://graph.facebook.com/{settings.meta_graph_api_version}/{settings.facebook_page_id}"
    if draft.image_url and draft.image_url.startswith("http"):
        endpoint = f"{base_url}/photos"
        payload = {
            "url": draft.image_url,
            "caption": _post_text(draft),
            "access_token": settings.facebook_page_access_token,
        }
    else:
        endpoint = f"{base_url}/feed"
        payload = {
            "message": _post_text(draft),
            "access_token": settings.facebook_page_access_token,
        }

    response = requests.post(endpoint, data=payload, timeout=60)
    response.raise_for_status()
    body = response.json()
    return {"platform": "facebook", "external_id": str(body.get("id") or body.get("post_id") or "")}


def _publish_instagram(draft: ContentDraft) -> dict[str, str]:
    if not settings.instagram_business_account_id or not settings.instagram_access_token:
        raise RuntimeError("INSTAGRAM_BUSINESS_ACCOUNT_ID and INSTAGRAM_ACCESS_TOKEN are required.")
    if not draft.image_url or not draft.image_url.startswith("http"):
        raise RuntimeError("Instagram publishing requires a public image_url.")

    base_url = (
        f"https://graph.facebook.com/{settings.meta_graph_api_version}/"
        f"{settings.instagram_business_account_id}"
    )
    create_response = requests.post(
        f"{base_url}/media",
        data={
            "image_url": draft.image_url,
            "caption": _post_text(draft),
            "access_token": settings.instagram_access_token,
        },
        timeout=60,
    )
    create_response.raise_for_status()
    creation_id = create_response.json().get("id")
    if not creation_id:
        raise RuntimeError("Instagram did not return a media container id.")

    publish_response = requests.post(
        f"{base_url}/media_publish",
        data={
            "creation_id": creation_id,
            "access_token": settings.instagram_access_token,
        },
        timeout=60,
    )
    publish_response.raise_for_status()
    return {"platform": "instagram", "external_id": str(publish_response.json().get("id") or "")}


def _publish_tiktok(draft: ContentDraft) -> dict[str, str]:
    if not settings.tiktok_access_token:
        raise RuntimeError("TIKTOK_ACCESS_TOKEN is required.")
    if not draft.image_url or not draft.image_url.startswith("http"):
        raise RuntimeError("TikTok publishing requires a public image_url.")

    response = requests.post(
        "https://open.tiktokapis.com/v2/post/publish/content/init/",
        headers={
            "Authorization": f"Bearer {settings.tiktok_access_token}",
            "Content-Type": "application/json; charset=UTF-8",
        },
        json={
            "post_info": {
                "title": _post_text(draft)[:2200],
                "privacy_level": "SELF_ONLY",
                "disable_duet": False,
                "disable_comment": False,
                "disable_stitch": False,
            },
            "source_info": {
                "source": "PULL_FROM_URL",
                "photo_cover_index": 0,
                "photo_images": [draft.image_url],
            },
            "post_mode": "DIRECT_POST",
            "media_type": "PHOTO",
        },
        timeout=60,
    )
    response.raise_for_status()
    body = response.json()
    publish_id = body.get("data", {}).get("publish_id") or body.get("publish_id") or ""
    return {"platform": "tiktok", "external_id": str(publish_id)}
