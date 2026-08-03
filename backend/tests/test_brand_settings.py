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


def test_read_brand_settings_creates_defaults() -> None:
    client = build_client()
    response = client.get("/api/v1/brand-settings", headers=auth_headers(client))

    assert response.status_code == 200
    body = response.json()
    assert body["company_name"] == "TrustTech Automation"
    assert body["primary_color"] == "#0F766E"
    assert "#TrustTech" in body["preferred_hashtags"]


def test_update_brand_settings() -> None:
    client = build_client()
    response = client.put(
        "/api/v1/brand-settings",
        headers=auth_headers(client),
        json={
            "company_name": "TrustTech AI",
            "writing_tone": "Warm, practical, and concise.",
            "preferred_hashtags": ["#TrustTechAI", "#Automation"],
            "posting_interval_minutes": 240,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["company_name"] == "TrustTech AI"
    assert body["writing_tone"] == "Warm, practical, and concise."
    assert body["posting_interval_minutes"] == 240


def test_brand_settings_requires_authentication() -> None:
    client = build_client()
    response = client.get("/api/v1/brand-settings")

    assert response.status_code == 401
