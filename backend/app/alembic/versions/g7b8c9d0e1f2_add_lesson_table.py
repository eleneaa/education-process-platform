"""add lesson table

Revision ID: g7b8c9d0e1f2
Revises: f6a7b8c9d0e1
Create Date: 2026-04-16 02:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'g7b8c9d0e1f2'
down_revision = 'f6a7b8c9d0e1'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'lesson',
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('scheduled_at', sa.DateTime(timezone=False), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=False, server_default='90'),
        sa.Column('location', sa.String(255), nullable=True),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('group_id', sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(['group_id'], ['group.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_lesson_group_id', 'lesson', ['group_id'])
    op.create_index('ix_lesson_scheduled_at', 'lesson', ['scheduled_at'])


def downgrade():
    op.drop_index('ix_lesson_scheduled_at', 'lesson')
    op.drop_index('ix_lesson_group_id', 'lesson')
    op.drop_table('lesson')
