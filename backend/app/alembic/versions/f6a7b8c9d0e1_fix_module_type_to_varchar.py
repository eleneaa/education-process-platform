"""fix module_type to varchar

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-04-16 00:01:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'f6a7b8c9d0e1'
down_revision = 'e5f6a7b8c9d0'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column(
        'module',
        'module_type',
        existing_type=sa.Enum('theoretical', 'practical', 'test', name='moduletype'),
        type_=sa.String(length=50),
        existing_nullable=False,
        postgresql_using="module_type::text",
    )


def downgrade():
    op.alter_column(
        'module',
        'module_type',
        existing_type=sa.String(length=50),
        type_=sa.Enum('theoretical', 'practical', 'test', name='moduletype'),
        existing_nullable=False,
        postgresql_using="module_type::moduletype",
    )
