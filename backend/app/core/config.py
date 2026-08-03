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
    ai_generation_mode: str = Field(default="mock", validation_alias="AI_GENERATION_MODE")
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
