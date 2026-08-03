from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import require_admin
from app.brand.service import get_or_create_brand_settings, update_brand_settings
from app.database.session import get_db
from app.models.brand_settings import BrandSettings
from app.models.user import User
from app.schemas.brand_settings import BrandSettingsRead, BrandSettingsUpdate

router = APIRouter()


@router.get("", response_model=BrandSettingsRead)
def read_brand_settings(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> BrandSettings:
    return get_or_create_brand_settings(db)


@router.put("", response_model=BrandSettingsRead)
def replace_brand_settings(
    payload: BrandSettingsUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> BrandSettings:
    return update_brand_settings(db, payload)
