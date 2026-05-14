from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from app.crud import crud_attendance
from app.api.deps import SessionDep, CurrentTeacherOrAdmin
from app.models import AttendanceCreate, AttendancePublic, AttendanceUpdate, AttendancesPublic

router = APIRouter(
    prefix="/attendance",
    tags=["Attendance"],
)


@router.get("/", response_model=AttendancesPublic)
def read_attendance(
    session: SessionDep,
    current_user: CurrentTeacherOrAdmin,
    group_id: UUID | None = Query(None),
) -> Any:
    """
    Get attendance records. If group_id is provided, returns all attendance for that group.
    Otherwise returns all attendance records (admin/teachers only).
    """
    if group_id:
        attendance_records = crud_attendance.get_attendance_by_group(
            session=session,
            group_id=group_id,
        )
    else:
        attendance_records = []

    return AttendancesPublic(data=attendance_records, count=len(attendance_records))


@router.get("/{attendance_id}", response_model=AttendancePublic)
def read_attendance_record(
    attendance_id: UUID,
    session: SessionDep,
    current_user: CurrentTeacherOrAdmin,
) -> Any:
    """
    Get a single attendance record by ID.
    """
    attendance = crud_attendance.get_attendance_by_id(
        session=session,
        attendance_id=attendance_id,
    )

    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    return attendance


@router.post("/", response_model=AttendancePublic)
def create_attendance(
    *,
    session: SessionDep,
    attendance_in: AttendanceCreate,
    current_user: CurrentTeacherOrAdmin,
) -> Any:
    """
    Create a new attendance record or update existing one (upsert pattern).
    Teachers/admins only.
    """
    attendance = crud_attendance.create_or_update_attendance(
        session=session,
        lesson_id=attendance_in.lesson_id,
        student_id=attendance_in.student_id,
        status=attendance_in.status,
    )

    return attendance


@router.patch("/{attendance_id}", response_model=AttendancePublic)
def update_attendance(
    *,
    session: SessionDep,
    attendance_id: UUID,
    attendance_in: AttendanceUpdate,
    current_user: CurrentTeacherOrAdmin,
) -> Any:
    """
    Update an attendance record's status.
    """
    attendance = crud_attendance.get_attendance_by_id(
        session=session,
        attendance_id=attendance_id,
    )

    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    attendance = crud_attendance.update_attendance(
        session=session,
        db_attendance=attendance,
        attendance_in=attendance_in,
    )

    return attendance


@router.delete("/{attendance_id}")
def delete_attendance(
    *,
    session: SessionDep,
    attendance_id: UUID,
    current_user: CurrentTeacherOrAdmin,
) -> Any:
    """
    Delete an attendance record.
    """
    attendance = crud_attendance.get_attendance_by_id(
        session=session,
        attendance_id=attendance_id,
    )

    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    crud_attendance.delete_attendance(session=session, db_attendance=attendance)
    return {"ok": True}
