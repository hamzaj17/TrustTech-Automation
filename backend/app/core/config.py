from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "TrustTech Automation"
    api_v1_prefix: str = "/api/v1"
    database_url: str = Field(
        default="sqlite:///./trusttech.db",
        validation_alias="DATABASE_URL",
    )
    secret_key: str = Field(
        default="change-this-secret-key-before-production",
        validation_alias="SECRET_KEY",
    )
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    groq_api_key: str | None = Field(default=None, validation_alias="GROQ_API_KEY")
    stability_api_key: str | None = Field(default=None, validation_alias="STABILITY_API_KEY")
    groq_text_model: str = Field(
        default="llama-3.3-70b-versatile",
        validation_alias="GROQ_TEXT_MODEL",
    )
    stability_image_model: str = Field(
        default="stable-image-core",
        validation_alias=AliasChoices("STABILITY_IMAGE_MODEL", "STABILITY_MODEL"),
    )
    cloudflare_worker_url: str | None = Field(default=None, validation_alias="CLOUDFLARE_WORKER_URL")
    cloudflare_api_key: str | None = Field(default=None, validation_alias="CLOUDFLARE_API_KEY")
    ai_generation_mode: str = Field(default="mock", validation_alias="AI_GENERATION_MODE")
    # Directory where generated images are saved (relative to backend root).
    # This resolves to: <backend-root>/backend/generated/images
    generated_images_dir: str = "backend/generated/images"
    social_publish_mode: str = Field(default="mock", validation_alias="SOCIAL_PUBLISH_MODE")
    auto_publish_platforms: str = Field(default="manual", validation_alias="AUTO_PUBLISH_PLATFORMS")
    meta_graph_api_version: str = Field(default="v20.0", validation_alias="META_GRAPH_API_VERSION")
    facebook_page_id: str | None = Field(default=None, validation_alias="FACEBOOK_PAGE_ID")
    facebook_page_access_token: str | None = Field(default=None, validation_alias="FACEBOOK_PAGE_ACCESS_TOKEN")
    instagram_business_account_id: str | None = Field(
        default=None,
        validation_alias="INSTAGRAM_BUSINESS_ACCOUNT_ID",
    )
    instagram_access_token: str | None = Field(default=None, validation_alias="INSTAGRAM_ACCESS_TOKEN")
    tiktok_access_token: str | None = Field(default=None, validation_alias="TIKTOK_ACCESS_TOKEN")

    model_config = SettingsConfigDict(env_file=(".env", "backend/.env"), extra="ignore")


settings = Settings()

# If CLOUDFLARE_API_KEY or CLOUDFLARE_WORKER_URL are not provided via env,
# attempt to read them from the frontend `ImageGenerator.jsx` file (best-effort).
try:
    if not settings.cloudflare_api_key or not settings.cloudflare_worker_url:
        from pathlib import Path
        import re

        # Find the repository root by walking up until we find frontend/src/ImageGenerator.jsx
        repo_root = None
        p = Path(__file__).resolve()
        for i in range(6):
            candidate_root = p.parents[i]
            candidate = candidate_root / "frontend" / "src" / "ImageGenerator.jsx"
            if candidate.exists():
                repo_root = candidate_root
                break

        if repo_root is not None:
            candidate = repo_root / "frontend" / "src" / "ImageGenerator.jsx"
            text = candidate.read_text(encoding="utf-8")

            # Look for explicit constant assignments e.g. CLOUDFLARE_BEARER = "..." or export const CLOUDFLARE_BEARER = '...'
            if not settings.cloudflare_api_key:
                m = re.search(r'CLOUDFLARE_BEARER\s*=?\s*["\']([^"\']+)["\']', text)
                if m:
                    token = m.group(1).strip()
                    if token:
                        settings.cloudflare_api_key = token

            # Look for worker URL constant assignment
            if not settings.cloudflare_worker_url:
                n = re.search(r'CLOUDFLARE_WORKER_URL\s*=?\s*["\'](https?://[^"\']+)["\']', text)
                if n:
                    settings.cloudflare_worker_url = n.group(1).strip()
except Exception:
    # Best-effort only; don't raise on failures reading frontend file
    pass
