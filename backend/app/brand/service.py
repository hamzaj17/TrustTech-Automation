from sqlalchemy.orm import Session

from app.brand.defaults import DEFAULT_BRAND_SETTINGS
from app.models.brand_settings import BrandSettings
from app.schemas.brand_settings import BrandSettingsUpdate


def get_or_create_brand_settings(db: Session) -> BrandSettings:
    settings = db.query(BrandSettings).first()
    if settings:
        return settings

    settings = BrandSettings(**DEFAULT_BRAND_SETTINGS)
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


def update_brand_settings(db: Session, payload: BrandSettingsUpdate) -> BrandSettings:
    settings = get_or_create_brand_settings(db)
    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(settings, field, value)

    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings
