"""add module type and content

Revision ID: e5f6a7b8c9d0
Revises: a1b2c3d4e5f6
Create Date: 2026-04-16 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'e5f6a7b8c9d0'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    moduletype = sa.Enum('theoretical', 'practical', 'test', name='moduletype')
    moduletype.create(op.get_bind(), checkfirst=True)

    op.add_column('module', sa.Column(
        'module_type',
        sa.Enum('theoretical', 'practical', 'test', name='moduletype'),
        nullable=False,
        server_default='theoretical',
    ))
    op.add_column('module', sa.Column('content', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('module', 'content')
    op.drop_column('module', 'module_type')
    sa.Enum(name='moduletype').drop(op.get_bind(), checkfirst=True)
