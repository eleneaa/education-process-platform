"""add_module_id_to_lesson

Revision ID: d3aee16197f8
Revises: 7f9e9ea00e31
Create Date: 2026-05-15 02:45:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd3aee16197f8'
down_revision = '7f9e9ea00e31'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('lesson', sa.Column('module_id', sa.Uuid(), nullable=True))
    op.create_foreign_key('fk_lesson_module_id', 'lesson', 'module', ['module_id'], ['id'], ondelete='SET NULL')


def downgrade():
    op.drop_constraint('fk_lesson_module_id', 'lesson', type_='foreignkey')
    op.drop_column('lesson', 'module_id')
