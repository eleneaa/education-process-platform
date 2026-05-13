"""Seed database with test data for different user roles."""
import logging
from datetime import datetime, timedelta
from sqlmodel import Session, select

from app.models.enums import UserRole, ProgramStatus, GroupStatus, EnrollmentStatus, AdmissionRequestStatus, ProgressStatus
from app.models import (
    User, UserCreate, Program, ProgramCreate, Group, GroupCreate,
    Enrollment, EnrollmentCreate, Progress, ProgressCreate,
    Module, ModuleCreate, AdmissionRequest, AdmissionRequestCreate,
    Lesson, LessonCreate
)
from app.crud import crud_user, crud_program, crud_module, crud_group, crud_enrollment, crud_progress

logger = logging.getLogger(__name__)


def seed_database(session: Session) -> None:
    """Seed the database with test data."""

    # Create teacher
    teacher = session.exec(select(User).where(User.email == "teacher@example.com")).first()
    if not teacher:
        teacher_in = UserCreate(
            email="teacher@example.com",
            password="password123",
            full_name="John Teacher",
            role=UserRole.TEACHER,
            is_active=True,
        )
        teacher = crud_user.create_user(session=session, user_create=teacher_in)
        logger.info("Created teacher: teacher@example.com")

    # Create student 1
    student1 = session.exec(select(User).where(User.email == "student1@example.com")).first()
    if not student1:
        student1_in = UserCreate(
            email="student1@example.com",
            password="password123",
            full_name="Alice Student",
            role=UserRole.STUDENT,
            is_active=True,
        )
        student1 = crud_user.create_user(session=session, user_create=student1_in)
        logger.info("Created student1: student1@example.com")

    # Create student 2
    student2 = session.exec(select(User).where(User.email == "student2@example.com")).first()
    if not student2:
        student2_in = UserCreate(
            email="student2@example.com",
            password="password123",
            full_name="Bob Student",
            role=UserRole.STUDENT,
            is_active=True,
        )
        student2 = crud_user.create_user(session=session, user_create=student2_in)
        logger.info("Created student2: student2@example.com")

    # Create program
    program = session.exec(select(Program).where(Program.title == "Python Basics")).first()
    if not program:
        program_in = ProgramCreate(
            title="Python Basics",
            description="Learn Python programming from scratch",
            status=ProgramStatus.APPROVED,
        )
        program = crud_program.create_program(
            session=session,
            program_create=program_in,
            created_by_id=teacher.id
        )
        logger.info("Created program: Python Basics")

    # Create modules
    module1 = session.exec(select(Module).where(Module.title == "Variables and Types")).first()
    if not module1:
        module1_in = ModuleCreate(
            title="Variables and Types",
            description="Learn about Python variables and data types",
            program_id=program.id,
            position=1,
        )
        module1 = crud_module.create_module(session=session, module_create=module1_in)
        logger.info("Created module: Variables and Types")

    module2 = session.exec(select(Module).where(Module.title == "Control Flow")).first()
    if not module2:
        module2_in = ModuleCreate(
            title="Control Flow",
            description="If statements, loops, and more",
            program_id=program.id,
            position=2,
        )
        module2 = crud_module.create_module(session=session, module_create=module2_in)
        logger.info("Created module: Control Flow")

    # Create group
    group = session.exec(select(Group).where(Group.name == "Python Group 1")).first()
    if not group:
        group_in = GroupCreate(
            name="Python Group 1",
            program_id=program.id,
            teacher_id=teacher.id,
            status=GroupStatus.ACTIVE,
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=60),
        )
        group = crud_group.create_group(session=session, group_create=group_in)
        logger.info("Created group: Python Group 1")

    # Enroll students
    enrollment1 = session.exec(
        select(Enrollment).where(
            (Enrollment.student_id == student1.id) & (Enrollment.group_id == group.id)
        )
    ).first()
    if not enrollment1:
        enrollment1_in = EnrollmentCreate(
            student_id=student1.id,
            group_id=group.id,
            status=EnrollmentStatus.ACTIVE,
        )
        enrollment1 = crud_enrollment.create_enrollment(
            session=session,
            enrollment_create=enrollment1_in
        )
        logger.info(f"Enrolled {student1.full_name} in {group.name}")

    enrollment2 = session.exec(
        select(Enrollment).where(
            (Enrollment.student_id == student2.id) & (Enrollment.group_id == group.id)
        )
    ).first()
    if not enrollment2:
        enrollment2_in = EnrollmentCreate(
            student_id=student2.id,
            group_id=group.id,
            status=EnrollmentStatus.ACTIVE,
        )
        enrollment2 = crud_enrollment.create_enrollment(
            session=session,
            enrollment_create=enrollment2_in
        )
        logger.info(f"Enrolled {student2.full_name} in {group.name}")

    # Create progress for student1 - high progress
    progress1_1 = session.exec(
        select(Progress).where(
            (Progress.student_id == student1.id) & (Progress.module_id == module1.id)
        )
    ).first()
    if not progress1_1:
        progress1_1_in = ProgressCreate(
            student_id=student1.id,
            module_id=module1.id,
            status=ProgressStatus.COMPLETED,
            score=95,
        )
        progress1_1 = crud_progress.create_progress(session=session, progress_create=progress1_1_in)
        logger.info(f"Created progress for {student1.full_name} - Module 1: COMPLETED")

    progress1_2 = session.exec(
        select(Progress).where(
            (Progress.student_id == student1.id) & (Progress.module_id == module2.id)
        )
    ).first()
    if not progress1_2:
        progress1_2_in = ProgressCreate(
            student_id=student1.id,
            module_id=module2.id,
            status=ProgressStatus.IN_PROGRESS,
            score=75,
        )
        progress1_2 = crud_progress.create_progress(session=session, progress_create=progress1_2_in)
        logger.info(f"Created progress for {student1.full_name} - Module 2: IN_PROGRESS")

    # Create progress for student2 - low progress
    progress2_1 = session.exec(
        select(Progress).where(
            (Progress.student_id == student2.id) & (Progress.module_id == module1.id)
        )
    ).first()
    if not progress2_1:
        progress2_1_in = ProgressCreate(
            student_id=student2.id,
            module_id=module1.id,
            status=ProgressStatus.IN_PROGRESS,
            score=45,
        )
        progress2_1 = crud_progress.create_progress(session=session, progress_create=progress2_1_in)
        logger.info(f"Created progress for {student2.full_name} - Module 1: IN_PROGRESS")

    progress2_2 = session.exec(
        select(Progress).where(
            (Progress.student_id == student2.id) & (Progress.module_id == module2.id)
        )
    ).first()
    if not progress2_2:
        progress2_2_in = ProgressCreate(
            student_id=student2.id,
            module_id=module2.id,
            status=ProgressStatus.NOT_STARTED,
        )
        progress2_2 = crud_progress.create_progress(session=session, progress_create=progress2_2_in)
        logger.info(f"Created progress for {student2.full_name} - Module 2: NOT_STARTED")

    logger.info("Database seeding completed!")
