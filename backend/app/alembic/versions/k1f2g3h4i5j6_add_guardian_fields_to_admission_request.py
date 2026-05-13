"""add guardian fields to admission_request

Revision ID: k1f2g3h4i5j6
Revises: j0e1f2g3h4i5
Create Date: 2026-04-28 18:45:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'k1f2g3h4i5j6'
down_revision = 'j0e1f2g3h4i5'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('admissionrequest', sa.Column('is_for_child', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('admissionrequest', sa.Column('child_name', sa.String(length=255), nullable=True))
    op.add_column('admissionrequest', sa.Column('guardian_name', sa.String(length=255), nullable=True))
    op.add_column('admissionrequest', sa.Column('guardian_phone', sa.String(length=20), nullable=True))

def downgrade():
    op.drop_column('admissionrequest', 'guardian_phone')
    op.drop_column('admissionrequest', 'guardian_name')
    op.drop_column('admissionrequest', 'child_name')
    op.drop_column('admissionrequest', 'is_for_child')
