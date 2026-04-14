"""add user role and gamification tables

Revision ID: a1b2c3d4e5f6
Revises: c7eb9e087eff
Create Date: 2026-04-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'c7eb9e087eff'
branch_labels = None
depends_on = None


def upgrade():
    # Add role column to user table
    userrole_enum = sa.Enum('ADMIN', 'TEACHER', 'STUDENT', name='userrole')
    userrole_enum.create(op.get_bind(), checkfirst=True)

    op.add_column(
        'user',
        sa.Column(
            'role',
            sa.Enum('ADMIN', 'TEACHER', 'STUDENT', name='userrole'),
            nullable=False,
            server_default='STUDENT',
        ),
    )

    # Achievement table
    op.create_table(
        'achievement',
        sa.Column('title', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.Column('points_required', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('icon', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )

    # UserPoints table (one record per user)
    op.create_table(
        'userpoints',
        sa.Column('points', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
    )

    # UserAchievement table
    op.create_table(
        'userachievement',
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('achievement_id', sa.Uuid(), nullable=False),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('awarded_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['achievement_id'], ['achievement.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'achievement_id', name='uq_user_achievement'),
    )


def downgrade():
    op.drop_table('userachievement')
    op.drop_table('userpoints')
    op.drop_table('achievement')
    op.drop_column('user', 'role')
    sa.Enum(name='userrole').drop(op.get_bind(), checkfirst=True)
