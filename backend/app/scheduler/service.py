from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.ai.content_engine import build_full_content
from app.brand.service import get_or_create_brand_settings
from app.core.config import settings
from app.models.content import ContentDraft
from app.models.scheduler_job import SchedulerJob
from app.schemas.scheduler import SchedulerRunSummary
from app.social.publisher import publish_draft

CONTENT_GENERATION_JOB = "content_generation"
POST_PUBLISH_JOB = "post_publish"


def run_scheduler_cycle(db: Session) -> SchedulerRunSummary:
    generation_job = create_scheduler_job(db, CONTENT_GENERATION_JOB)
    publish_job = create_scheduler_job(db, POST_PUBLISH_JOB)

    execute_job(db, generation_job, lambda: _trigger_content_generation(db))
    execute_job(db, publish_job, lambda: _publish_posts(db))

    return get_scheduler_status(db)


def retry_failed_jobs(db: Session) -> SchedulerRunSummary:
    failed_jobs = (
        db.query(SchedulerJob)
        .filter(
            SchedulerJob.status == "failed",
            SchedulerJob.attempts < SchedulerJob.max_attempts,
        )
        .order_by(SchedulerJob.created_at.asc())
        .all()
    )

    for job in failed_jobs:
        execute_job(db, job, _handler_for_job_type(db, job.job_type))

    summary = get_scheduler_status(db)
    summary.retried_jobs = len(failed_jobs)
    return summary


def get_scheduler_status(db: Session) -> SchedulerRunSummary:
    jobs = db.query(SchedulerJob).all()
    last_finished_job = (
        db.query(SchedulerJob)
        .filter(SchedulerJob.finished_at.isnot(None))
        .order_by(SchedulerJob.finished_at.desc())
        .first()
    )

    return SchedulerRunSummary(
        total_jobs=len(jobs),
        pending_jobs=sum(job.status == "pending" for job in jobs),
        running_jobs=sum(job.status == "running" for job in jobs),
        succeeded_jobs=sum(job.status == "succeeded" for job in jobs),
        failed_jobs=sum(job.status == "failed" for job in jobs),
        last_run_at=last_finished_job.finished_at if last_finished_job else None,
    )


def list_scheduler_jobs(db: Session) -> list[SchedulerJob]:
    return db.query(SchedulerJob).order_by(SchedulerJob.created_at.desc()).all()


def create_scheduler_job(db: Session, job_type: str) -> SchedulerJob:
    job = SchedulerJob(job_type=job_type, status="pending")
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def execute_job(db: Session, job: SchedulerJob, handler) -> SchedulerJob:
    now = datetime.now(timezone.utc)
    job.status = "running"
    job.started_at = now
    job.attempts += 1
    job.error_message = None
    db.add(job)
    db.commit()

    try:
        job.result = handler()
        job.status = "succeeded"
    except Exception as exc:
        job.status = "failed"
        job.error_message = str(exc)
    finally:
        job.finished_at = datetime.now(timezone.utc)
        db.add(job)
        db.commit()
        db.refresh(job)

    return job


def _handler_for_job_type(db: Session, job_type: str):
    if job_type == CONTENT_GENERATION_JOB:
        return lambda: _trigger_content_generation(db)
    if job_type == POST_PUBLISH_JOB:
        return lambda: _publish_posts(db)
    return _unknown_job


def _trigger_content_generation(db: Session) -> dict[str, str]:
    get_or_create_brand_settings(db)
    now = datetime.now(timezone.utc)
    draft = build_full_content(db, topic=None, category="technology")
    draft.status = "scheduled"
    draft.platform = settings.auto_publish_platforms
    draft.approved_at = now
    draft.scheduled_for = now
    db.add(draft)
    db.commit()
    db.refresh(draft)
    return {
        "message": "Content generated and scheduled for publishing.",
        "draft_id": draft.id,
    }


def _publish_posts(db: Session) -> dict[str, str | int]:
    now = datetime.now(timezone.utc)
    due_drafts = (
        db.query(ContentDraft)
        .filter(ContentDraft.status == "scheduled", ContentDraft.scheduled_for <= now)
        .order_by(ContentDraft.scheduled_for.asc())
        .all()
    )

    results = []
    for draft in due_drafts:
        result = publish_draft(draft)
        draft.status = "published" if result["mode"] == "real" else "published_mock"
        draft.published_at = now
        db.add(draft)
        results.append({"draft_id": draft.id, **result})

    db.commit()
    return {
        "message": "Publishing completed.",
        "published_count": len(due_drafts),
        "results": results,
    }


def _unknown_job() -> dict[str, str]:
    raise ValueError("Unknown scheduler job type.")
