from enum import Enum


class EnrollmentRequestSource(str, Enum):
    WEBSITE = "website"
    TELEGRAM = "telegram"
    EMAIL = "email"
    PHONE = "phone"
    OFFLINE = "offline"

class EnrollmentRequestStatus(str, Enum):
    NEW = "new"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    REJECTED = "rejected"

class ProgramStatus(str, Enum):
    DRAFT = "draft"
    ON_REVIEW = "on_review"
    APPROVED = "approved"
    REJECTED = "rejected"

class GroupStatus(str, Enum):
    PLANNED = "planned"
    ACTIVE = "active"
    FINISHED = "finished"
    CANCELED = "canceled"

class EnrollmentStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    DROPPED = "dropped"

class ProgressStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"