from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"


class AdmissionRequestSource(str, Enum):
    WEBSITE = "website"
    TELEGRAM = "telegram"
    EMAIL = "email"
    PHONE = "phone"
    OFFLINE = "offline"

class AdmissionRequestStatus(str, Enum):
    NEW = "new"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    REJECTED = "rejected"

class ProgramStatus(str, Enum):
    DRAFT = "draft"
    ON_REVIEW = "on_review"
    APPROVED = "approved"
    REJECTED = "rejected"

class ModuleType(str, Enum):
    THEORETICAL = "theoretical"
    PRACTICAL = "practical"
    TEST = "test"

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