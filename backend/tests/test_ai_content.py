from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from starlette.testclient import TestClient

from app.core.config import settings
from app.database.session import Base, get_db
from app.main import create_app


def build_client() -> TestClient:
    settings.ai_generation_mode = "mock"
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app = create_app()
    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)


def auth_headers(client: TestClient) -> dict[str, str]:
    client.post(
        "/api/v1/auth/register",
        json={"email": "admin@trusttech.example.com", "password": "secure-password"},
    )
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@trusttech.example.com", "password": "secure-password"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_generate_topic_avoids_recent_duplicates() -> None:
    client = build_client()
    headers = auth_headers(client)
    client.get("/api/v1/brand-settings", headers=headers)

    first = client.post(
        "/api/v1/ai/topics/generate",
        headers=headers,
        json={"category": "automation"},
    )
    second = client.post(
        "/api/v1/ai/topics/generate",
        headers=headers,
        json={"category": "automation"},
    )

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["topic"] != second.json()["topic"]


def test_generate_topic_does_not_prefix_category_into_topic_text() -> None:
    client = build_client()
    headers = auth_headers(client)
    client.get("/api/v1/brand-settings", headers=headers)

    response = client.post(
        "/api/v1/ai/topics/generate",
        headers=headers,
        json={"category": "Artificial Intelligence"},
    )

    assert response.status_code == 200
    topic = response.json()["topic"]
    assert not topic.lower().startswith("artificial intelligence ")
    assert topic != "Artificial Intelligence"


def test_generate_full_content_pipeline() -> None:
    client = build_client()
    headers = auth_headers(client)
    client.get("/api/v1/brand-settings", headers=headers)

    response = client.post(
        "/api/v1/ai/content/generate-full",
        headers=headers,
        json={"category": "automation"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["topic"]
    assert body["caption"]
    assert body["call_to_action"]
    assert body["hashtags"]
    assert body["image_prompt"]
    assert body["image_url"]
    assert body["image_path"]
    assert body["status"] == "ready"

    listing = client.get("/api/v1/ai/content", headers=headers)
    assert listing.status_code == 200
    assert len(listing.json()) == 1

    item = client.get(f"/api/v1/ai/content/{body['id']}", headers=headers)
    assert item.status_code == 200
    assert item.json()["id"] == body["id"]


def test_review_schedule_publish_and_export_content() -> None:
    client = build_client()
    headers = auth_headers(client)
    client.get("/api/v1/brand-settings", headers=headers)

    generated = client.post(
        "/api/v1/ai/content/generate-full",
        headers=headers,
        json={"category": "automation"},
    ).json()

    approved = client.post(
        f"/api/v1/ai/content/{generated['id']}/approve",
        headers=headers,
    )
    assert approved.status_code == 200
    assert approved.json()["status"] == "approved"
    assert approved.json()["approved_at"] is not None

    scheduled = client.post(
        f"/api/v1/ai/content/{generated['id']}/schedule",
        headers=headers,
        json={
            "platform": "manual",
            "scheduled_for": "2026-08-01T13:00:00+05:00",
        },
    )
    assert scheduled.status_code == 200
    assert scheduled.json()["status"] == "scheduled"
    assert scheduled.json()["platform"] == "manual"

    exported = client.get(
        f"/api/v1/ai/content/{generated['id']}/export",
        headers=headers,
    )
    assert exported.status_code == 200
    assert generated["caption"] in exported.json()["post_text"]
    assert exported.json()["image_path"]

    published = client.post(
        f"/api/v1/ai/content/{generated['id']}/publish-mock",
        headers=headers,
    )
    assert published.status_code == 200
    assert published.json()["status"] == "published_mock"
    assert published.json()["published_at"] is not None


def test_reject_content() -> None:
    client = build_client()
    headers = auth_headers(client)
    client.get("/api/v1/brand-settings", headers=headers)

    generated = client.post(
        "/api/v1/ai/content/generate-full",
        headers=headers,
        json={"category": "automation"},
    ).json()

    rejected = client.post(
        f"/api/v1/ai/content/{generated['id']}/reject",
        headers=headers,
        json={"reason": "Needs a clearer hook."},
    )

    assert rejected.status_code == 200
    assert rejected.json()["status"] == "rejected"
    assert rejected.json()["rejection_reason"] == "Needs a clearer hook."
