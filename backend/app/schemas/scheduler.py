from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class SchedulerJobRead(BaseModel):
    id: UUID
    job_type: str
    status: str
    attempts: int
    max_attempts: int
    scheduled_for: datetime
    started_at: datetime | None
    finished_at: datetime | None
    error_message: str | None
    result: dict | None

    model_config = ConfigDict(from_attributes=True)


class SchedulerRunSummary(BaseModel):
    total_jobs: int
    pending_jobs: int
    running_jobs: int
    succeeded_jobs: int
    failed_jobs: int
    retried_jobs: int = 0
    last_run_at: datetime | None = None
