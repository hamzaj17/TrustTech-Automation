from fastapi import APIRouter

from app.api.routes import auth, brand_settings, scheduler, ai_content

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(ai_content.router, prefix="/ai", tags=["ai"])
api_router.include_router(
    brand_settings.router,
    prefix="/brand-settings",
    tags=["brand settings"],
)
api_router.include_router(scheduler.router, prefix="/scheduler", tags=["scheduler"])
