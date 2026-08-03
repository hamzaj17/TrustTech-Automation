from __future__ import annotations

from collections.abc import Iterable


def normalize_hashtag(tag: str) -> str:
    clean_tag = tag.strip()
    if not clean_tag:
        return ""
    if not clean_tag.startswith("#"):
        clean_tag = f"#{clean_tag}"
    return "#" + clean_tag.lstrip("#").replace(" ", "")


def build_hashtags(base_hashtags: Iterable[str], topic: str, limit: int = 8) -> list[str]:
    topic_words = [word.strip(".,:;!?()[]{}") for word in topic.split() if len(word) > 3]
    topic_tags = [f"#{word.title().replace('/', '')}" for word in topic_words[:3]]

    hashtags: list[str] = []
    for tag in list(base_hashtags) + topic_tags:
        normalized = normalize_hashtag(tag)
        if normalized and normalized not in hashtags:
            hashtags.append(normalized)
        if len(hashtags) >= limit:
            break
    return hashtags