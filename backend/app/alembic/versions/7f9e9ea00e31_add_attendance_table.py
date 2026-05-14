"""add_attendance_table

Revision ID: 7f9e9ea00e31
Revises: 7f9e9ea00e30
Create Date: 2026-05-14 18:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7f9e9ea00e31'
down_revision = '7f9e9ea00e30'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'attendance',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('lesson_id', sa.Uuid(), nullable=False),
        sa.Column('student_id', sa.Uuid(), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='present'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['lesson_id'], ['lesson.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_attendance_lesson_id', 'attendance', ['lesson_id'])
    op.create_index('ix_attendance_student_id', 'attendance', ['student_id'])
    op.create_index('ix_attendance_lesson_student', 'attendance', ['lesson_id', 'student_id'], unique=True)


def downgrade():
    op.drop_index('ix_attendance_lesson_student', 'attendance')
    op.drop_index('ix_attendance_student_id', 'attendance')
    op.drop_index('ix_attendance_lesson_id', 'attendance')
    op.drop_table('attendance')
