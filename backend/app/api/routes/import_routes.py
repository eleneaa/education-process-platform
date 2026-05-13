import csv
import io
from typing import Any

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from sqlmodel import select

from app.api.deps import SessionDep, CurrentUser, CurrentTeacherOrAdmin, get_current_active_superuser
from app.models import (
    User, Program, Group, AdmissionRequest, Module,
    UserCreate, ProgramCreate, GroupCreate, AdmissionRequestCreate, ModuleCreate
)
from app.models.enums import UserRole, ProgramStatus, GroupStatus, AdmissionRequestSource, AdmissionRequestStatus, ModuleType
from app.crud import crud_user, crud_program, crud_group, crud_admission_request, crud_module

router = APIRouter(prefix="/import", tags=["Import"])


class ImportResult:
    def __init__(self):
        self.created = 0
        self.skipped = 0
        self.errors: list[str] = []

    def to_dict(self) -> dict[str, Any]:
        return {
            "created": self.created,
            "skipped": self.skipped,
            "errors": self.errors,
        }


@router.post("/users")
async def import_users(
    *,
    file: UploadFile = File(...),
    session: SessionDep,
    current_user: CurrentUser,
) -> dict[str, Any]:
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Only superusers can import users")

    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    result = ImportResult()
    contents = await file.read()

    try:
        reader = csv.DictReader(io.StringIO(contents.decode("utf-8")))
        for row_num, row in enumerate(reader, start=2):
            try:
                email = row.get("email", "").strip()
                full_name = row.get("full_name", "").strip()
                role = row.get("role", "STUDENT").strip().upper()
                password = row.get("password", "ChangeMeASAP123!").strip()

                if not email:
                    result.errors.append(f"Row {row_num}: Email is required")
                    result.skipped += 1
                    continue

                if not full_name:
                    result.errors.append(f"Row {row_num}: Full name is required")
                    result.skipped += 1
                    continue

                if crud_user.get_user_by_email(session, email=email):
                    result.errors.append(f"Row {row_num}: User with email '{email}' already exists")
                    result.skipped += 1
                    continue

                try:
                    user_role = UserRole(role)
                except ValueError:
                    result.errors.append(f"Row {row_num}: Invalid role '{role}'. Must be STUDENT, TEACHER, or ADMIN")
                    result.skipped += 1
                    continue

                user_in = UserCreate(
                    email=email,
                    full_name=full_name,
                    password=password,
                    role=user_role,
                )
                crud_user.create_user(session=session, user_create=user_in)
                result.created += 1

            except Exception as e:
                result.errors.append(f"Row {row_num}: {str(e)}")
                result.skipped += 1

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading CSV: {str(e)}")

    return result.to_dict()


@router.post("/programs")
async def import_programs(
    *,
    file: UploadFile = File(...),
    session: SessionDep,
    current_user: CurrentTeacherOrAdmin,
) -> dict[str, Any]:
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    result = ImportResult()
    contents = await file.read()

    try:
        reader = csv.DictReader(io.StringIO(contents.decode("utf-8")))
        for row_num, row in enumerate(reader, start=2):
            try:
                title = row.get("title", "").strip()
                description = row.get("description", "").strip() or None
                status = row.get("status", "draft").strip().lower()

                if not title:
                    result.errors.append(f"Row {row_num}: Title is required")
                    result.skipped += 1
                    continue

                try:
                    prog_status = ProgramStatus(status)
                except ValueError:
                    result.errors.append(f"Row {row_num}: Invalid status '{status}'")
                    result.skipped += 1
                    continue

                program_in = ProgramCreate(
                    title=title,
                    description=description,
                    status=prog_status,
                )
                crud_program.create_program(session=session, program_in=program_in, user_id=current_user.id)
                result.created += 1

            except Exception as e:
                result.errors.append(f"Row {row_num}: {str(e)}")
                result.skipped += 1

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading CSV: {str(e)}")

    return result.to_dict()


@router.post("/groups")
async def import_groups(
    *,
    file: UploadFile = File(...),
    session: SessionDep,
    current_user: CurrentTeacherOrAdmin,
) -> dict[str, Any]:
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    result = ImportResult()
    contents = await file.read()

    try:
        reader = csv.DictReader(io.StringIO(contents.decode("utf-8")))
        for row_num, row in enumerate(reader, start=2):
            try:
                name = row.get("name", "").strip()
                program_title = row.get("program_title", "").strip()
                teacher_email = row.get("teacher_email", "").strip() or None
                status = row.get("status", "planned").strip().lower()
                start_date_str = row.get("start_date", "").strip() or None
                end_date_str = row.get("end_date", "").strip() or None

                if not name:
                    result.errors.append(f"Row {row_num}: Name is required")
                    result.skipped += 1
                    continue

                if not program_title:
                    result.errors.append(f"Row {row_num}: Program title is required")
                    result.skipped += 1
                    continue

                statement = select(Program).where(Program.title == program_title)
                program = session.exec(statement).first()
                if not program:
                    result.errors.append(f"Row {row_num}: Program '{program_title}' not found")
                    result.skipped += 1
                    continue

                teacher_id = None
                if teacher_email:
                    teacher = crud_user.get_user_by_email(session, email=teacher_email)
                    if not teacher:
                        result.errors.append(f"Row {row_num}: Teacher with email '{teacher_email}' not found")
                        result.skipped += 1
                        continue
                    teacher_id = teacher.id

                try:
                    group_status = GroupStatus(status)
                except ValueError:
                    result.errors.append(f"Row {row_num}: Invalid status '{status}'")
                    result.skipped += 1
                    continue

                group_in = GroupCreate(
                    name=name,
                    program_id=program.id,
                    teacher_id=teacher_id,
                    status=group_status,
                    start_date=start_date_str,
                    end_date=end_date_str,
                )
                crud_group.create_group(session=session, group_in=group_in)
                result.created += 1

            except Exception as e:
                result.errors.append(f"Row {row_num}: {str(e)}")
                result.skipped += 1

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading CSV: {str(e)}")

    return result.to_dict()


@router.post("/admission-requests")
async def import_admission_requests(
    *,
    file: UploadFile = File(...),
    session: SessionDep,
) -> dict[str, Any]:
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    result = ImportResult()
    contents = await file.read()

    try:
        reader = csv.DictReader(io.StringIO(contents.decode("utf-8")))
        for row_num, row in enumerate(reader, start=2):
            try:
                full_name = row.get("full_name", "").strip()
                phone_number = row.get("phone_number", "").strip()
                email = row.get("email", "").strip() or None
                program_interest = row.get("program_interest", "").strip() or None
                source = row.get("source", "website").strip().lower()
                comment = row.get("comment", "").strip() or None
                is_for_child_str = row.get("is_for_child", "false").strip().lower()
                child_name = row.get("child_name", "").strip() or None
                guardian_name = row.get("guardian_name", "").strip() or None
                guardian_phone = row.get("guardian_phone", "").strip() or None

                if not full_name:
                    result.errors.append(f"Row {row_num}: Full name is required")
                    result.skipped += 1
                    continue

                if not phone_number:
                    result.errors.append(f"Row {row_num}: Phone number is required")
                    result.skipped += 1
                    continue

                is_for_child = is_for_child_str in ("true", "yes", "1", "t", "y")

                try:
                    req_source = AdmissionRequestSource(source)
                except ValueError:
                    result.errors.append(f"Row {row_num}: Invalid source '{source}'")
                    result.skipped += 1
                    continue

                admission_request_in = AdmissionRequestCreate(
                    full_name=full_name,
                    phone_number=phone_number,
                    email=email,
                    program_interest=program_interest,
                    source=req_source,
                    comment=comment,
                    is_for_child=is_for_child,
                    child_name=child_name,
                    guardian_name=guardian_name,
                    guardian_phone=guardian_phone,
                )
                crud_admission_request.create_admission_request(
                    session=session,
                    admission_request_create=admission_request_in,
                )
                result.created += 1

            except Exception as e:
                result.errors.append(f"Row {row_num}: {str(e)}")
                result.skipped += 1

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading CSV: {str(e)}")

    return result.to_dict()


@router.post("/modules")
async def import_modules(
    *,
    file: UploadFile = File(...),
    session: SessionDep,
    current_user: CurrentTeacherOrAdmin,
) -> dict[str, Any]:
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    result = ImportResult()
    contents = await file.read()

    try:
        reader = csv.DictReader(io.StringIO(contents.decode("utf-8")))
        for row_num, row in enumerate(reader, start=2):
            try:
                title = row.get("title", "").strip()
                description = row.get("description", "").strip() or None
                program_title = row.get("program_title", "").strip()
                module_type = row.get("module_type", "theoretical").strip().lower()
                position_str = row.get("position", "").strip()
                content = row.get("content", "").strip() or None

                if not title:
                    result.errors.append(f"Row {row_num}: Title is required")
                    result.skipped += 1
                    continue

                if not program_title:
                    result.errors.append(f"Row {row_num}: Program title is required")
                    result.skipped += 1
                    continue

                statement = select(Program).where(Program.title == program_title)
                program = session.exec(statement).first()
                if not program:
                    result.errors.append(f"Row {row_num}: Program '{program_title}' not found")
                    result.skipped += 1
                    continue

                try:
                    mod_type = ModuleType(module_type)
                except ValueError:
                    result.errors.append(f"Row {row_num}: Invalid module_type '{module_type}'")
                    result.skipped += 1
                    continue

                position = None
                if position_str:
                    try:
                        position = int(position_str)
                    except ValueError:
                        result.errors.append(f"Row {row_num}: Position must be a number")
                        result.skipped += 1
                        continue

                module_in = ModuleCreate(
                    title=title,
                    description=description,
                    program_id=program.id,
                    module_type=mod_type,
                    position=position,
                    content=content,
                )
                crud_module.create_module(session=session, module_create=module_in)
                result.created += 1

            except Exception as e:
                result.errors.append(f"Row {row_num}: {str(e)}")
                result.skipped += 1

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading CSV: {str(e)}")

    return result.to_dict()
