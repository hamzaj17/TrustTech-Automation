from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from starlette.testclient import TestClient

from app.database.session import Base, get_db
from app.main import create_app


def build_client() -> TestClient:
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=__import__("sqlalchemy.pool").pool.StaticPool,
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


def test_register_login_and_read_current_user() -> None:
    client = build_client()

    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "admin@trusttech.example.com",
            "password": "secure-password",
            "full_name": "TrustTech Admin",
        },
    )

    assert register_response.status_code == 201
    assert register_response.json()["email"] == "admin@trusttech.example.com"
    assert "hashed_password" not in register_response.json()

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@trusttech.example.com", "password": "secure-password"},
    )

    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    me_response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert me_response.status_code == 200
    assert me_response.json()["role"] == "admin"


def test_login_rejects_invalid_password() -> None:
    client = build_client()
    client.post(
        "/api/v1/auth/register",
        json={"email": "admin@trusttech.example.com", "password": "secure-password"},
    )

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@trusttech.example.com", "password": "wrong-password"},
    )

    assert response.status_code == 401


def test_register_allows_only_first_admin() -> None:
    client = build_client()
    first_response = client.post(
        "/api/v1/auth/register",
        json={"email": "admin@trusttech.example.com", "password": "secure-password"},
    )
    second_response = client.post(
        "/api/v1/auth/register",
        json={"email": "second@trusttech.example.com", "password": "secure-password"},
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 403
