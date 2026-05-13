from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException
from sqlmodel import SQLModel, select, func

from app.crud import crud_progress, crud_enrollment
from app.api.deps import SessionDep, CurrentUser, CurrentTeacherOrAdmin
from app.models import Program, Group, User, AdmissionRequest, Enrollment, Progress
from app.models.enums import (
    UserRole, GroupStatus, ProgramStatus, AdmissionRequestStatus, EnrollmentStatus, ProgressStatus
)

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)


class DashboardStats(SQLModel):
    active_programs: int
    active_groups: int
    active_students: int
    pending_admissions: int


class GroupWithProgress(SQLModel):
    group_id: UUID
    group_name: str
    program_name: str
    student_count: int
    progress_percentage: float


class StudentWithLag(SQLModel):
    student_id: UUID
    student_name: str
    group_name: str
    progress_percentage: float
    days_elapsed: int
    total_days: int


class TopStudent(SQLModel):
    student_id: UUID
    student_name: str
    group_name: str
    progress_percentage: float
    completed_modules: int
    total_modules: int


class ProgramProgressSummary(SQLModel):
    student_id: UUID
    program_id: UUID
    total_modules: int
    completed_modules: int
    percentage: float


class GroupProgressReport(SQLModel):
    group_id: UUID
    program_id: UUID
    students: list[ProgramProgressSummary]


@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(
    session: SessionDep,
    current_user: CurrentTeacherOrAdmin,
) -> Any:
    """
    Get dashboard summary statistics for admin.
    Returns counts of active programs, groups, students, and pending admissions.
    """
    active_programs = session.exec(
        select(func.count(Program.id)).where(Program.status == ProgramStatus.APPROVED)
    ).one()

    active_groups = session.exec(
        select(func.count(Group.id)).where(Group.status == GroupStatus.ACTIVE)
    ).one()

    active_students = session.exec(
        select(func.count(Enrollment.student_id).distinct()).where(
            Enrollment.status == EnrollmentStatus.ACTIVE
        )
    ).one()

    pending_admissions = session.exec(
        select(func.count(AdmissionRequest.id)).where(
            AdmissionRequest.status.in_([AdmissionRequestStatus.NEW, AdmissionRequestStatus.IN_REVIEW])
        )
    ).one()

    return DashboardStats(
        active_programs=active_programs,
        active_groups=active_groups,
        active_students=active_students,
        pending_admissions=pending_admissions,
    )


@router.get("/dashboard/groups", response_model=list[GroupWithProgress])
def get_groups_with_progress(
    session: SessionDep,
    current_user: CurrentTeacherOrAdmin,
) -> Any:
    """
    Get all active groups with their progress percentage.
    """
    groups = session.exec(
        select(Group).where(Group.status == GroupStatus.ACTIVE)
    ).all()

    result = []
    for group in groups:
        enrollments = session.exec(
            select(Enrollment).where(Enrollment.group_id == group.id)
        ).all()

        if not enrollments:
            progress_percentage = 0.0
        else:
            total_progress = 0
            for enrollment in enrollments:
                summary = crud_progress.get_program_progress_summary(
                    session=session,
                    student_id=enrollment.student_id,
                    program_id=group.program_id,
                )
                total_progress += summary.get("percentage", 0)
            progress_percentage = total_progress / len(enrollments)

        program = session.get(Program, group.program_id)
        result.append(
            GroupWithProgress(
                group_id=group.id,
                group_name=group.name,
                program_name=program.name if program else "Unknown",
                student_count=len(enrollments),
                progress_percentage=progress_percentage,
            )
        )

    return result


@router.get("/dashboard/lagging-students", response_model=list[StudentWithLag])
def get_lagging_students(
    session: SessionDep,
    current_user: CurrentTeacherOrAdmin,
) -> Any:
    """
    Get students with progress < 30% when more than 50% of the course time has passed.
    """
    from datetime import datetime

    result = []
    enrollments = session.exec(select(Enrollment)).all()

    for enrollment in enrollments:
        group = session.get(Group, enrollment.group_id)
        if not group or group.status != GroupStatus.ACTIVE:
            continue

        summary = crud_progress.get_program_progress_summary(
            session=session,
            student_id=enrollment.student_id,
            program_id=group.program_id,
        )
        progress_percentage = summary.get("percentage", 0)

        if progress_percentage < 30 and group.end_date:
            start = group.start_date or datetime.now()
            end = group.end_date
            total_days = (end - start).days
            elapsed = (datetime.now() - start).days

            if total_days > 0 and elapsed / total_days > 0.5:
                student = session.get(User, enrollment.student_id)
                result.append(
                    StudentWithLag(
                        student_id=enrollment.student_id,
                        student_name=student.full_name or student.email if student else "Unknown",
                        group_name=group.name,
                        progress_percentage=progress_percentage,
                        days_elapsed=elapsed,
                        total_days=total_days,
                    )
                )

    return result


@router.get("/dashboard/top-students", response_model=list[TopStudent])
def get_top_students(
    session: SessionDep,
    current_user: CurrentTeacherOrAdmin,
    limit: int = 10,
) -> Any:
    """
    Get top students by progress percentage.
    """
    students_with_progress = []

    enrollments = session.exec(select(Enrollment)).all()
    for enrollment in enrollments:
        summary = crud_progress.get_program_progress_summary(
            session=session,
            student_id=enrollment.student_id,
            program_id=session.get(Group, enrollment.group_id).program_id,
        )
        student = session.get(User, enrollment.student_id)
        group = session.get(Group, enrollment.group_id)

        students_with_progress.append(
            TopStudent(
                student_id=enrollment.student_id,
                student_name=student.full_name or student.email if student else "Unknown",
                group_name=group.name if group else "Unknown",
                progress_percentage=summary.get("percentage", 0),
                completed_modules=summary.get("completed_modules", 0),
                total_modules=summary.get("total_modules", 0),
            )
        )

    sorted_students = sorted(students_with_progress, key=lambda x: x.progress_percentage, reverse=True)
    return sorted_students[:limit]


@router.get(
    "/programs/{program_id}/students/{student_id}/progress",
    response_model=ProgramProgressSummary,
)
def get_student_program_progress(
    program_id: UUID,
    student_id: UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Returns progress summary for a student within a program.
    P = (N_completed / N_total) × 100 — computed dynamically.
    Students can only view their own progress.
    """
    from app.models.enums import UserRole
    if (
        current_user.role == UserRole.STUDENT
        and not current_user.is_superuser
        and student_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not enough privileges")

    program = session.get(Program, program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    summary = crud_progress.get_program_progress_summary(
        session=session,
        student_id=student_id,
        program_id=program_id,
    )

    return ProgramProgressSummary(
        student_id=student_id,
        program_id=program_id,
        **summary,
    )


@router.get(
    "/groups/{group_id}/progress",
    response_model=GroupProgressReport,
)
def get_group_progress_report(
    group_id: UUID,
    session: SessionDep,
    current_user: CurrentTeacherOrAdmin,
) -> Any:
    """
    Returns progress summaries for all enrolled students in a group.
    Teachers and admins only.
    """
    group = session.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    enrollments = crud_enrollment.get_enrollments_by_group(
        session=session, group_id=group_id
    )

    student_summaries: list[ProgramProgressSummary] = []
    for enrollment in enrollments:
        summary = crud_progress.get_program_progress_summary(
            session=session,
            student_id=enrollment.student_id,
            program_id=group.program_id,
        )
        student_summaries.append(
            ProgramProgressSummary(
                student_id=enrollment.student_id,
                program_id=group.program_id,
                **summary,
            )
        )

    return GroupProgressReport(
        group_id=group_id,
        program_id=group.program_id,
        students=student_summaries,
    )
