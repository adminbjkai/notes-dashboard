"""add_parent_id_and_position

Revision ID: 8b7f28de9c38
Revises: cc47695d1509
Create Date: 2025-12-17 03:23:44.690118

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8b7f28de9c38'
down_revision: Union[str, None] = 'cc47695d1509'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add parent_id column (nullable for root-level pages)
    op.add_column('notes', sa.Column('parent_id', sa.String(length=36), nullable=True))

    # Add position column with default 0 for existing rows
    op.add_column('notes', sa.Column('position', sa.Integer(), server_default='0', nullable=False))

    # Add foreign key constraint
    op.create_foreign_key('fk_notes_parent_id', 'notes', 'notes', ['parent_id'], ['id'], ondelete='SET NULL')

    # Add index for faster tree queries
    op.create_index('idx_notes_parent_id', 'notes', ['parent_id'])
    op.create_index('idx_notes_position', 'notes', ['position'])


def downgrade() -> None:
    op.drop_index('idx_notes_position', table_name='notes')
    op.drop_index('idx_notes_parent_id', table_name='notes')
    op.drop_constraint('fk_notes_parent_id', 'notes', type_='foreignkey')
    op.drop_column('notes', 'position')
    op.drop_column('notes', 'parent_id')
