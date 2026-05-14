"""Seed database with comprehensive test data for different user roles."""
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
    """Seed the database with comprehensive test data."""

    # ==================== USERS ====================
    # Teachers
    teacher1 = session.exec(select(User).where(User.email == "teacher@example.com")).first()
    if not teacher1:
        teacher1_in = UserCreate(
            email="teacher@example.com",
            password="password123",
            full_name="John Teacher",
            role=UserRole.TEACHER,
            is_active=True,
        )
        teacher1 = crud_user.create_user(session=session, user_create=teacher1_in)
        logger.info("✓ Created teacher: teacher@example.com")

    teacher2 = session.exec(select(User).where(User.email == "teacher2@example.com")).first()
    if not teacher2:
        teacher2_in = UserCreate(
            email="teacher2@example.com",
            password="password123",
            full_name="Jane Educator",
            role=UserRole.TEACHER,
            is_active=True,
        )
        teacher2 = crud_user.create_user(session=session, user_create=teacher2_in)
        logger.info("✓ Created teacher: teacher2@example.com")

    # Students - Good performers
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
        logger.info("✓ Created student: student1@example.com")

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
        logger.info("✓ Created student: student2@example.com")

    # Students - Average performers
    student3 = session.exec(select(User).where(User.email == "student3@example.com")).first()
    if not student3:
        student3_in = UserCreate(
            email="student3@example.com",
            password="password123",
            full_name="Charlie Brown",
            role=UserRole.STUDENT,
            is_active=True,
        )
        student3 = crud_user.create_user(session=session, user_create=student3_in)
        logger.info("✓ Created student: student3@example.com")

    student4 = session.exec(select(User).where(User.email == "student4@example.com")).first()
    if not student4:
        student4_in = UserCreate(
            email="student4@example.com",
            password="password123",
            full_name="Diana Prince",
            role=UserRole.STUDENT,
            is_active=True,
        )
        student4 = crud_user.create_user(session=session, user_create=student4_in)
        logger.info("✓ Created student: student4@example.com")

    # Students - Struggling
    student5 = session.exec(select(User).where(User.email == "student5@example.com")).first()
    if not student5:
        student5_in = UserCreate(
            email="student5@example.com",
            password="password123",
            full_name="Ethan Hunt",
            role=UserRole.STUDENT,
            is_active=True,
        )
        student5 = crud_user.create_user(session=session, user_create=student5_in)
        logger.info("✓ Created student: student5@example.com")

    # ==================== PROGRAMS ====================

    # Program 1: Python Basics
    program1 = session.exec(select(Program).where(Program.title == "Python Basics")).first()
    if not program1:
        program1_in = ProgramCreate(
            title="Python Basics",
            description="Learn Python programming from scratch - variables, loops, functions",
            status=ProgramStatus.APPROVED,
        )
        program1 = crud_program.create_program(
            session=session,
            program_create=program1_in,
            created_by_id=teacher1.id
        )
        logger.info("✓ Created program: Python Basics")

    # Program 2: Web Development
    program2 = session.exec(select(Program).where(Program.title == "Web Development Fundamentals")).first()
    if not program2:
        program2_in = ProgramCreate(
            title="Web Development Fundamentals",
            description="HTML, CSS, JavaScript basics for web development",
            status=ProgramStatus.APPROVED,
        )
        program2 = crud_program.create_program(
            session=session,
            program_create=program2_in,
            created_by_id=teacher2.id
        )
        logger.info("✓ Created program: Web Development Fundamentals")

    # Program 3: Data Science
    program3 = session.exec(select(Program).where(Program.title == "Data Science Intro")).first()
    if not program3:
        program3_in = ProgramCreate(
            title="Data Science Intro",
            description="Introduction to data analysis with Python and Pandas",
            status=ProgramStatus.ON_REVIEW,
        )
        program3 = crud_program.create_program(
            session=session,
            program_create=program3_in,
            created_by_id=teacher2.id
        )
        logger.info("✓ Created program: Data Science Intro")

    # ==================== MODULES ====================

    # Python Basics Modules
    module1 = session.exec(select(Module).where(Module.title == "Variables and Types")).first()
    if not module1:
        module1_in = ModuleCreate(
            title="Variables and Types",
            description="Learn about variables, data types, and type conversion",
            program_id=program1.id,
            position=1,
        )
        module1 = crud_module.create_module(session=session, module_create=module1_in)
        logger.info("✓ Created module: Variables and Types")

    module2 = session.exec(select(Module).where(Module.title == "Control Flow")).first()
    if not module2:
        module2_in = ModuleCreate(
            title="Control Flow",
            description="If statements, loops, and control structures",
            program_id=program1.id,
            position=2,
        )
        module2 = crud_module.create_module(session=session, module_create=module2_in)
        logger.info("✓ Created module: Control Flow")

    module3 = session.exec(select(Module).where(Module.title == "Functions")).first()
    if not module3:
        module3_in = ModuleCreate(
            title="Functions",
            description="Writing and using functions, parameters, return values",
            program_id=program1.id,
            position=3,
        )
        module3 = crud_module.create_module(session=session, module_create=module3_in)
        logger.info("✓ Created module: Functions")

    # Web Development Modules
    module4 = session.exec(select(Module).where(Module.title == "HTML Basics")).first()
    if not module4:
        module4_in = ModuleCreate(
            title="HTML Basics",
            description="Structure and semantic HTML",
            program_id=program2.id,
            position=1,
        )
        module4 = crud_module.create_module(session=session, module_create=module4_in)
        logger.info("✓ Created module: HTML Basics")

    module5 = session.exec(select(Module).where(Module.title == "CSS Styling")).first()
    if not module5:
        module5_in = ModuleCreate(
            title="CSS Styling",
            description="Styling with CSS, flexbox, and grid",
            program_id=program2.id,
            position=2,
        )
        module5 = crud_module.create_module(session=session, module_create=module5_in)
        logger.info("✓ Created module: CSS Styling")

    module6 = session.exec(select(Module).where(Module.title == "JavaScript Basics")).first()
    if not module6:
        module6_in = ModuleCreate(
            title="JavaScript Basics",
            description="JavaScript fundamentals and DOM manipulation",
            program_id=program2.id,
            position=3,
        )
        module6 = crud_module.create_module(session=session, module_create=module6_in)
        logger.info("✓ Created module: JavaScript Basics")

    # Data Science Modules
    module7 = session.exec(select(Module).where(Module.title == "Data Basics")).first()
    if not module7:
        module7_in = ModuleCreate(
            title="Data Basics",
            description="Understanding data, CSV files, and data formats",
            program_id=program3.id,
            position=1,
        )
        module7 = crud_module.create_module(session=session, module_create=module7_in)
        logger.info("✓ Created module: Data Basics")

    # ==================== GROUPS ====================

    # Python Group 1
    group1 = session.exec(select(Group).where(Group.name == "Python Group 1")).first()
    if not group1:
        group1_in = GroupCreate(
            name="Python Group 1",
            program_id=program1.id,
            teacher_id=teacher1.id,
            status=GroupStatus.ACTIVE,
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=60),
        )
        group1 = crud_group.create_group(session=session, group_create=group1_in)
        logger.info("✓ Created group: Python Group 1")

    # Python Group 2
    group2 = session.exec(select(Group).where(Group.name == "Python Group 2")).first()
    if not group2:
        group2_in = GroupCreate(
            name="Python Group 2",
            program_id=program1.id,
            teacher_id=teacher1.id,
            status=GroupStatus.ACTIVE,
            start_date=datetime.now() + timedelta(days=1),
            end_date=datetime.now() + timedelta(days=61),
        )
        group2 = crud_group.create_group(session=session, group_create=group2_in)
        logger.info("✓ Created group: Python Group 2")

    # Web Development Group
    group3 = session.exec(select(Group).where(Group.name == "Web Dev Group")).first()
    if not group3:
        group3_in = GroupCreate(
            name="Web Dev Group",
            program_id=program2.id,
            teacher_id=teacher2.id,
            status=GroupStatus.ACTIVE,
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=90),
        )
        group3 = crud_group.create_group(session=session, group_create=group3_in)
        logger.info("✓ Created group: Web Dev Group")

    # Data Science Group
    group4 = session.exec(select(Group).where(Group.name == "Data Science Group")).first()
    if not group4:
        group4_in = GroupCreate(
            name="Data Science Group",
            program_id=program3.id,
            teacher_id=teacher2.id,
            status=GroupStatus.PLANNED,
            start_date=datetime.now() + timedelta(days=30),
            end_date=datetime.now() + timedelta(days=120),
        )
        group4 = crud_group.create_group(session=session, group_create=group4_in)
        logger.info("✓ Created group: Data Science Group")

    # ==================== ENROLLMENTS ====================

    # Group 1 enrollments
    enrollments = [
        (student1, group1, EnrollmentStatus.ACTIVE),
        (student1, group2, EnrollmentStatus.ACTIVE),
        (student1, group3, EnrollmentStatus.ACTIVE),
        (student2, group1, EnrollmentStatus.ACTIVE),
        (student3, group2, EnrollmentStatus.ACTIVE),
        (student4, group2, EnrollmentStatus.ACTIVE),
        (student4, group3, EnrollmentStatus.ACTIVE),
        (student5, group2, EnrollmentStatus.ACTIVE),
    ]

    for student, group, status in enrollments:
        existing = session.exec(
            select(Enrollment).where(
                (Enrollment.student_id == student.id) & (Enrollment.group_id == group.id)
            )
        ).first()
        if not existing:
            enrollment_in = EnrollmentCreate(
                student_id=student.id,
                group_id=group.id,
                status=status,
            )
            crud_enrollment.create_enrollment(session=session, enrollment_create=enrollment_in)
            logger.info(f"✓ Enrolled {student.full_name} in {group.name}")

    # ==================== PROGRESS RECORDS ====================

    # Student 1 - Alice (High performer)
    progress_data = [
        # Group 1 - Python
        (student1, module1, "completed", 95),
        (student1, module2, "in_progress", 80),
        (student1, module3, "not_started", None),
        # Group 3 - Web
        (student1, module4, "completed", 92),
        (student1, module5, "in_progress", 70),

        # Student 2 - Bob (Lagging)
        (student2, module1, "in_progress", 45),
        (student2, module2, "not_started", None),
        (student2, module3, "not_started", None),

        # Student 3 - Charlie (Average)
        (student3, module1, "completed", 72),
        (student3, module2, "in_progress", 65),
        (student3, module3, "in_progress", 60),

        # Student 4 - Diana (Good)
        (student4, module1, "completed", 88),
        (student4, module2, "completed", 85),
        (student4, module3, "in_progress", 75),
        (student4, module4, "in_progress", 80),
        (student4, module5, "not_started", None),

        # Student 5 - Ethan (Struggling)
        (student5, module1, "in_progress", 30),
        (student5, module2, "not_started", None),
        (student5, module3, "not_started", None),
    ]

    for student, module, status, score in progress_data:
        existing = session.exec(
            select(Progress).where(
                (Progress.student_id == student.id) & (Progress.module_id == module.id)
            )
        ).first()
        if not existing:
            progress_in = ProgressCreate(
                student_id=student.id,
                module_id=module.id,
                status=status,
                score=score,
            )
            crud_progress.create_progress(session=session, progress_create=progress_in)
            logger.info(f"✓ {student.full_name} - {module.title}: {status.upper()} ({score}%)" if score else f"✓ {student.full_name} - {module.title}: {status.upper()}")

    # ==================== PROGRAM TEACHERS ====================

    # Link teachers to programs
    try:
        program_teacher_links = [
            (program1, teacher1),  # Python Basics - teacher1
            (program2, teacher2),  # Web Development - teacher2
            (program3, teacher1),  # Data Science - teacher1
            (program3, teacher2),  # Data Science - teacher2 (both teach this)
        ]

        for program, teacher in program_teacher_links:
            existing = session.exec(
                select(ProgramTeacher).where(
                    (ProgramTeacher.program_id == program.id) &
                    (ProgramTeacher.teacher_id == teacher.id)
                )
            ).first()
            if not existing:
                pt = ProgramTeacher(program_id=program.id, teacher_id=teacher.id)
                session.add(pt)
                logger.info(f"✓ Linked {teacher.full_name} to {program.title}")

        session.flush()
    except Exception as e:
        logger.warning(f"⚠ Could not link teachers to programs (table might not exist): {e}")
        session.rollback()

    # ==================== LESSONS ====================

    # Use fixed dates to prevent duplicates when script runs multiple times
    lessons_data = [
        # Python Group 1 - Mondays & Thursdays at 10:00 (May 14, 16, 20, 23)
        (group1, "Python Basics - Variables", "Learn about variables and data types", datetime(2026, 5, 14, 10, 0), "Room 101"),
        (group1, "Python Basics - Loops", "Working with for and while loops", datetime(2026, 5, 16, 10, 0), "Room 101"),
        (group1, "Python Basics - Functions", "Writing and using functions", datetime(2026, 5, 21, 10, 0), "Room 101"),
        (group1, "Python Basics - Review", "Review and Q&A session", datetime(2026, 5, 23, 10, 0), "Room 101"),

        # Python Group 2 - Tuesdays & Fridays at 14:00 (May 15, 17, 22, 24)
        (group2, "Python Basics - Variables", "Learn about variables and data types", datetime(2026, 5, 15, 14, 0), "Room 102"),
        (group2, "Python Basics - Loops", "Working with for and while loops", datetime(2026, 5, 17, 14, 0), "Room 102"),
        (group2, "Python Basics - Functions", "Writing and using functions", datetime(2026, 5, 22, 14, 0), "Room 102"),
        (group2, "Python Basics - Review", "Review and Q&A session", datetime(2026, 5, 24, 14, 0), "Room 102"),

        # Web Development Group - Wednesdays & Saturdays at 15:00 (May 15, 18, 22, 25)
        (group3, "HTML Fundamentals", "HTML structure and semantic tags", datetime(2026, 5, 15, 15, 0), "Room 201"),
        (group3, "CSS Styling Basics", "CSS selectors and styling", datetime(2026, 5, 18, 15, 0), "Room 201"),
        (group3, "JavaScript Introduction", "JavaScript basics and DOM", datetime(2026, 5, 22, 15, 0), "Room 201"),
        (group3, "Web Project Kickoff", "Start building a web project", datetime(2026, 5, 25, 15, 0), "Room 201"),

        # Additional lessons on May 15 for testing multiple lessons per day
        (group1, "Python Basics - Advanced Variables", "Deep dive into Python variables", datetime(2026, 5, 15, 10, 0), "Room 101"),
        (group3, "CSS Responsive Design", "Building responsive layouts", datetime(2026, 5, 15, 11, 30), "Room 201"),
        (group1, "Python Basics - Problem Solving", "Solving problems with Python", datetime(2026, 5, 15, 16, 30), "Room 101"),
    ]

    for group, title, description, scheduled_at, location in lessons_data:
        existing = session.exec(
            select(Lesson).where(
                (Lesson.group_id == group.id) &
                (Lesson.title == title) &
                (Lesson.scheduled_at == scheduled_at)
            )
        ).first()
        if not existing:
            lesson_in = LessonCreate(
                title=title,
                description=description,
                group_id=group.id,
                scheduled_at=scheduled_at,
                duration_minutes=90,
                location=location,
            )
            crud_lesson.create_lesson(session=session, lesson_create=lesson_in)
            logger.info(f"✓ Created lesson: {title}")

    logger.info("✓ Database seeding completed!")
    session.flush()
    session.commit()
