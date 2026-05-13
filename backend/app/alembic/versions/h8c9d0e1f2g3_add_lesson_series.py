"""add lesson series_id

Revision ID: h8c9d0e1f2g3
Revises: g7b8c9d0e1f2
Create Date: 2026-04-16 03:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'h8c9d0e1f2g3'
down_revision = 'g7b8c9d0e1f2'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('lesson', sa.Column('series_id', sa.Uuid(), nullable=True))
    op.create_index('ix_lesson_series_id', 'lesson', ['series_id'])


def downgrade():
    op.drop_index('ix_lesson_series_id', 'lesson')
    op.drop_column('lesson', 'series_id')
