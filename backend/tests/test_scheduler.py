from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from starlette.testclient import TestClient

from app.database.session import Base, get_db
from app.main import create_app


def build_client() -> TestClient:
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


def test_run_scheduler_cycle_records_jobs() -> None:
    client = build_client()
    headers = auth_headers(client)

    response = client.post("/api/v1/scheduler/run", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["total_jobs"] == 2
    assert body["succeeded_jobs"] == 2
    assert body["failed_jobs"] == 0


def test_scheduler_mock_publishes_due_scheduled_content() -> None:
    client = build_client()
    headers = auth_headers(client)
    client.get("/api/v1/brand-settings", headers=headers)
    generated = client.post(
        "/api/v1/ai/content/generate-full",
        headers=headers,
        json={"category": "automation"},
    ).json()
    client.post(
        f"/api/v1/ai/content/{generated['id']}/schedule",
        headers=headers,
        json={
            "platform": "manual",
            "scheduled_for": "2026-01-01T10:00:00+05:00",
        },
    )

    response = client.post("/api/v1/scheduler/run", headers=headers)
    draft = client.get(f"/api/v1/ai/content/{generated['id']}", headers=headers)
    jobs = client.get("/api/v1/scheduler/jobs", headers=headers).json()
    publish_job = next(job for job in jobs if job["job_type"] == "post_publish")

    assert response.status_code == 200
    assert draft.json()["status"] == "published_mock"
    assert publish_job["result"]["published_count"] >= 1


def test_list_scheduler_jobs() -> None:
    client = build_client()
    headers = auth_headers(client)
    client.post("/api/v1/scheduler/run", headers=headers)

    response = client.get("/api/v1/scheduler/jobs", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 2
    assert {job["job_type"] for job in body} == {"content_generation", "post_publish"}


def test_scheduler_requires_authentication() -> None:
    client = build_client()
    response = client.post("/api/v1/scheduler/run")

    assert response.status_code == 401
