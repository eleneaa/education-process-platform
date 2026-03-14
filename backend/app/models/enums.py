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