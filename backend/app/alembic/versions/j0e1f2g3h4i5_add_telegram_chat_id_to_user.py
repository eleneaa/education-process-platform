"""add telegram_chat_id to user

Revision ID: j0e1f2g3h4i5
Revises: i9d0e1f2g3h4
Create Date: 2026-04-28 12:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'j0e1f2g3h4i5'
down_revision = 'i9d0e1f2g3h4'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'user',
        sa.Column('telegram_chat_id', sa.BigInteger(), nullable=True)
    )
    op.create_unique_constraint(
        'uq_user_telegram_chat_id', 'user', ['telegram_chat_id']
    )


def downgrade():
    op.drop_constraint('uq_user_telegram_chat_id', 'user', type_='unique')
    op.drop_column('user', 'telegram_chat_id')
