from __future__ import annotations

from dataclasses import dataclass
import re
from typing import Iterable

from sqlalchemy.orm import Session

from app.models.brand_settings import BrandSettings
from app.models.content import GeneratedTopic


_TOPIC_LIBRARY = (
    "How small businesses can use automation to save 5 hours every week",
    "A practical AI workflow for faster customer follow-up",
    "Five technology habits that improve team productivity without extra tools",
    "How to turn repetitive admin work into a simple automation stack",
    "What modern operations teams should automate first",
    "The smartest way to use AI for better content planning",
    "How startups can streamline lead management with lightweight automation",
    "Why service businesses should standardize their digital workflow",
    "A simple roadmap for introducing AI into your daily operations",
    "How to make your customer communication faster and more consistent",
)


@dataclass(frozen=True)
class TopicCandidate:
    topic: str
    category: str | None


def _recent_topics(db: Session, limit: int = 20) -> set[str]:
    rows = (
        db.query(GeneratedTopic.topic)
        .order_by(GeneratedTopic.created_at.desc())
        .limit(limit)
        .all()
    )
    return {row[0].strip().lower() for row in rows}


def _normalize(text: str) -> str:
    # lower, remove punctuation, collapse whitespace
    t = text.lower()
    t = re.sub(r"[^\w\s]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def _token_set(text: str) -> set[str]:
    return set(_normalize(text).split())


def _is_similar(a: str, b: str, overlap_threshold: float = 0.5) -> bool:
    a_tokens = _token_set(a)
    b_tokens = _token_set(b)
    if not a_tokens or not b_tokens:
        return False
    inter = a_tokens.intersection(b_tokens)
    # similarity measured relative to smaller token set
    smaller = min(len(a_tokens), len(b_tokens))
    return (len(inter) / smaller) >= overlap_threshold


def _candidate_pool(category: str | None, brand_settings: BrandSettings) -> list[TopicCandidate]:
    audience_hint = brand_settings.target_audience.split(",")[0].strip().lower()
    base_topics = [TopicCandidate(topic=topic, category=category) for topic in _TOPIC_LIBRARY]
    if audience_hint:
        base_topics.extend(
            TopicCandidate(
                topic=f"{topic} for {audience_hint}".strip(),
                category=category,
            )
            for topic in _TOPIC_LIBRARY[:4]
        )
    return base_topics


def choose_mock_topic(db: Session, category: str | None, brand_settings: BrandSettings) -> TopicCandidate:
    # Prefer producing topics in categories that haven't been used recently.
    # Define a list of candidate categories to rotate through when category is not specified.
    CATEGORIES = ["technology", "cybersecurity", "ai", "productivity", "operations", "marketing", "software"]

    # Fetch existing topics and categories for deduping
    rows = db.query(GeneratedTopic.topic, GeneratedTopic.category).order_by(GeneratedTopic.created_at.desc()).all()
    existing_topics = {row[0].strip().lower() for row in rows if row[0]}
    recent_categories = [row[1] for row in rows if row[1]]

    target_category = category
    if not target_category:
        # pick a category not present in recent history, fallback to rotating list
        for c in CATEGORIES:
            if c not in recent_categories:
                target_category = c
                break
        if not target_category:
            # all categories seen recently — pick the least-recently-used category
            for c in CATEGORIES:
                if c not in recent_categories[:5]:
                    target_category = c
                    break
        if not target_category:
            target_category = CATEGORIES[0]

    # build candidate pool using the chosen target_category
    candidates = _candidate_pool(target_category, brand_settings)

    # choose a candidate that is not identical or similar to previous topics
    for candidate in candidates:
        cand_text = candidate.topic.strip()
        if cand_text.lower() in existing_topics:
            continue
        # avoid near-duplicates by token overlap
        if any(_is_similar(cand_text, existing) for existing in existing_topics):
            continue
        return candidate

    # If exhausted, create a distinctive fallback using a timestamp-like counter
    base = "Unique automation idea"
    i = 1
    while True:
        fallback = f"{base} {len(existing_topics) + i}"
        if fallback.strip().lower() not in existing_topics:
            return TopicCandidate(topic=fallback, category=target_category)
        i += 1


def generate_topic(db: Session, category: str | None, brand_settings: BrandSettings) -> GeneratedTopic:
    candidate = choose_mock_topic(db, category, brand_settings)
    generated_topic = GeneratedTopic(topic=candidate.topic, category=candidate.category)
    db.add(generated_topic)
    db.commit()
    db.refresh(generated_topic)
    return generated_topic