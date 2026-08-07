from sqlalchemy.orm import Session

from app.database.session import SessionLocal
from app.scheduler.service import run_scheduler_cycle


def start_background_scheduler() -> object | None:
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
    except ImportError:
        return None

    scheduler = BackgroundScheduler(timezone="UTC")
    # Run the scheduler cycle on a multi-hour interval by default so
    # content generation and publishing aren't triggered too frequently.
    # Use minutes=1 only for short-lived development debugging if needed.
    scheduler.add_job(
        _run_cycle_with_new_session,
        trigger="interval",
        hours=8,
        id="trusttech_scheduler_cycle",
        replace_existing=True,
    )
    scheduler.start()
    return scheduler


def _run_cycle_with_new_session() -> None:
    db: Session = SessionLocal()
    try:
        run_scheduler_cycle(db)
    finally:
        db.close()
