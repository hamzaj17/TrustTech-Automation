from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.core.config import settings
from app.database.session import Base, engine
from app.models.brand_settings import BrandSettings
from app.models.content import AIGenerationLog, ContentDraft, GeneratedTopic
from app.models.scheduler_job import SchedulerJob
from app.models.user import User
from app.scheduler.runtime import start_background_scheduler


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name)
    app.state.scheduler = None
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://127.0.0.1:5173",
            "http://localhost:5173",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(api_router, prefix=settings.api_v1_prefix)

    # Ensure generated images directory exists and mount it at /generated/images
    from pathlib import Path

    gen_dir = Path(settings.generated_images_dir)
    if not gen_dir.is_absolute():
        # Resolve relative to the backend folder (two parents up from this file is the backend folder)
        backend_root = Path(__file__).resolve().parents[1]
        gen_dir = (backend_root / settings.generated_images_dir).resolve()
    gen_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/generated/images", StaticFiles(directory=str(gen_dir)), name="generated_images")

    @app.on_event("startup")
    def create_tables() -> None:
        Base.metadata.create_all(bind=engine)
        app.state.scheduler = start_background_scheduler()

    @app.on_event("shutdown")
    def stop_scheduler() -> None:
        scheduler = app.state.scheduler
        if scheduler:
            scheduler.shutdown()

    @app.get("/health", tags=["health"])
    def health_check() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()

__all__ = [
    "AIGenerationLog",
    "BrandSettings",
    "ContentDraft",
    "GeneratedTopic",
    "SchedulerJob",
    "User",
    "app",
    "create_app",
]
