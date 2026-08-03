from __future__ import annotations

from dataclasses import dataclass

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
    recent_topics = _recent_topics(db)
    for candidate in _candidate_pool(category, brand_settings):
        if candidate.topic.lower() not in recent_topics:
            return candidate

    fallback = f"Automation idea {len(recent_topics) + 1}"
    return TopicCandidate(topic=fallback, category=category)


def generate_topic(db: Session, category: str | None, brand_settings: BrandSettings) -> GeneratedTopic:
    candidate = choose_mock_topic(db, category, brand_settings)
    generated_topic = GeneratedTopic(topic=candidate.topic, category=candidate.category)
    db.add(generated_topic)
    db.commit()
    db.refresh(generated_topic)
    return generated_topic