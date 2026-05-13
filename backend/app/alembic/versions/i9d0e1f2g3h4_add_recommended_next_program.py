"""add recommended_next_program_id to program

Revision ID: i9d0e1f2g3h4
Revises: h8c9d0e1f2g3
Create Date: 2026-04-23 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'i9d0e1f2g3h4'
down_revision = 'h8c9d0e1f2g3'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('program', sa.Column('recommended_next_program_id', sa.Uuid(), nullable=True))
    op.create_foreign_key(
        'fk_program_recommended_next_program_id',
        'program',
        'program',
        ['recommended_next_program_id'],
        ['id'],
        ondelete='SET NULL'
    )


def downgrade():
    op.drop_constraint('fk_program_recommended_next_program_id', 'program')
    op.drop_column('program', 'recommended_next_program_id')
