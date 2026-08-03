from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import require_admin
from app.database.session import get_db
from app.models.scheduler_job import SchedulerJob
from app.models.user import User
from app.schemas.scheduler import SchedulerJobRead, SchedulerRunSummary
from app.scheduler.service import (
    get_scheduler_status,
    list_scheduler_jobs,
    retry_failed_jobs,
    run_scheduler_cycle,
)

router = APIRouter()


@router.get("/status", response_model=SchedulerRunSummary)
def read_scheduler_status(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> SchedulerRunSummary:
    return get_scheduler_status(db)


@router.post("/run", response_model=SchedulerRunSummary)
def run_scheduler_now(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> SchedulerRunSummary:
    return run_scheduler_cycle(db)


@router.post("/retry-failed", response_model=SchedulerRunSummary)
def retry_scheduler_failures(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> SchedulerRunSummary:
    return retry_failed_jobs(db)


@router.get("/jobs", response_model=list[SchedulerJobRead])
def read_scheduler_jobs(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[SchedulerJob]:
    return list_scheduler_jobs(db)
