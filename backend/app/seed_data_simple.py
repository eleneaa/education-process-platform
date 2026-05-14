"""Expanded seed database with large dataset."""
import logging
from datetime import datetime, timedelta
from sqlmodel import Session, select

from app.models.enums import UserRole, ProgramStatus, GroupStatus, EnrollmentStatus
from app.models import (
    User, UserCreate, Program, ProgramCreate, Group, GroupCreate,
    Enrollment, EnrollmentCreate, Progress, ProgressCreate,
    Module, ModuleCreate, Lesson, LessonCreate, ProgramTeacher
)
from app.crud import crud_user, crud_program, crud_module, crud_group, crud_enrollment, crud_progress, crud_lesson

logger = logging.getLogger(__name__)


def seed_database(session: Session) -> None:
    """Seed with expanded dataset."""

    # Teachers
    teacher1 = session.exec(select(User).where(User.email == "teacher@example.com")).first() or \
        crud_user.create_user(session=session, user_create=UserCreate(
            email="teacher@example.com", password="password123", 
            full_name="John Teacher", role=UserRole.TEACHER, is_active=True))

    teacher2 = session.exec(select(User).where(User.email == "teacher2@example.com")).first() or \
        crud_user.create_user(session=session, user_create=UserCreate(
            email="teacher2@example.com", password="password123",
            full_name="Jane Educator", role=UserRole.TEACHER, is_active=True))

    # Create 30 students
    students = []
    for i in range(1, 31):
        email = f"student{i}@example.com"
        student = session.exec(select(User).where(User.email == email)).first()
        if not student:
            student = crud_user.create_user(session=session, user_create=UserCreate(
                email=email, password="password123",
                full_name=f"Student {i}", role=UserRole.STUDENT, is_active=True))
        students.append(student)

    logger.info(f"✓ Created/verified {len(students)} students")

    # Create 10 programs
    programs = []
    prog_titles = ["Python", "Web Dev", "Data Science", "JavaScript", "React", "Node.js", "Django", "FastAPI", "SQL", "Cloud"]
    for title in prog_titles:
        existing = session.exec(select(Program).where(Program.title == title)).first()
        if not existing:
            prog = crud_program.create_program(session=session, program_create=ProgramCreate(
                title=title, description=f"{title} course", status=ProgramStatus.APPROVED),
                created_by_id=teacher1.id)
            programs.append(prog)
        else:
            programs.append(existing)

    logger.info(f"✓ Created/verified {len(programs)} programs")

    # Create 4 modules per program
    modules = []
    module_names = ["Fundamentals", "Intermediate", "Advanced", "Project"]
    for prog in programs:
        for mod_name in module_names:
            title = f"{prog.title} - {mod_name}"
            existing = session.exec(select(Module).where(Module.title == title)).first()
            if not existing:
                mod = crud_module.create_module(session=session, module_create=ModuleCreate(
                    title=title, description=f"{mod_name} module", 
                    program_id=prog.id, position=module_names.index(mod_name) + 1))
                modules.append(mod)
            else:
                modules.append(existing)

    logger.info(f"✓ Created/verified {len(modules)} modules")

    # Create 3 groups per program
    groups = []
    rooms = ["Room 101", "Room 102", "Room 201", "Lab 1", "Hall A", "Virtual"]
    for prog in programs:
        for g in range(1, 4):
            name = f"{prog.title} - Group {g}"
            existing = session.exec(select(Group).where(Group.name == name)).first()
            if not existing:
                grp = crud_group.create_group(session=session, group_create=GroupCreate(
                    name=name, program_id=prog.id, teacher_id=teacher1.id if g % 2 else teacher2.id,
                    status=GroupStatus.ACTIVE, 
                    start_date=datetime.now(), end_date=datetime.now() + timedelta(days=90)))
                groups.append(grp)
            else:
                groups.append(existing)

    logger.info(f"✓ Created/verified {len(groups)} groups")

    # Enroll students in groups (5-7 per group)
    for grp in groups:
        for i in range(5 + (hash(grp.id) % 3)):
            student = students[i % len(students)]
            existing = session.exec(select(Enrollment).where(
                (Enrollment.student_id == student.id) & (Enrollment.group_id == grp.id))).first()
            if not existing:
                crud_enrollment.create_enrollment(session=session, enrollment_create=EnrollmentCreate(
                    student_id=student.id, group_id=grp.id, status=EnrollmentStatus.ACTIVE))

    logger.info("✓ Created enrollments")

    # Create progress for each student-module pair (limited)
    for module in modules[:10]:  # First 10 modules
        for student in students[:15]:  # First 15 students
            existing = session.exec(select(Progress).where(
                (Progress.student_id == student.id) & (Progress.module_id == module.id))).first()
            if not existing:
                status = ["completed", "in_progress", "not_started"][(hash(student.id) + hash(module.id)) % 3]
                score = None if status == "not_started" else 30 + (hash(student.id) + hash(module.id)) % 70
                crud_progress.create_progress(session=session, progress_create=ProgressCreate(
                    student_id=student.id, module_id=module.id, status=status, score=score))

    logger.info("✓ Created progress records")

    # Create lessons for each group (14 days, 2-3 per day)
    lesson_count = 0
    for grp in groups:
        for day in range(14):
            for hour in [9, 14]:
                if (day + hash(grp.id)) % 3 == 0:  # Not every slot
                    lesson_date = datetime(2026, 5, 14) + timedelta(days=day, hours=hour)
                    room = rooms[(hash(grp.id) + day) % len(rooms)]
                    existing = session.exec(select(Lesson).where(
                        (Lesson.group_id == grp.id) & (Lesson.scheduled_at == lesson_date))).first()
                    if not existing:
                        crud_lesson.create_lesson(session=session, lesson_create=LessonCreate(
                            title=f"{grp.name} - Lesson",
                            description=f"Session for {grp.name}",
                            group_id=grp.id, scheduled_at=lesson_date,
                            duration_minutes=90, location=room))
                        lesson_count += 1

    logger.info(f"✓ Created {lesson_count} lessons")

    # Link teachers to programs
    for prog in programs:
        for teacher in [teacher1, teacher2]:
            existing = session.exec(select(ProgramTeacher).where(
                (ProgramTeacher.program_id == prog.id) & (ProgramTeacher.teacher_id == teacher.id))).first()
            if not existing:
                session.add(ProgramTeacher(program_id=prog.id, teacher_id=teacher.id))

    session.flush()
    logger.info("✓ Database seeding completed with large dataset!")
