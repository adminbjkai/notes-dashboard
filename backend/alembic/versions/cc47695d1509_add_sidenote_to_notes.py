"""add sidenote to notes

Revision ID: cc47695d1509
Revises: 001
Create Date: 2025-12-15 17:06:20.170641

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cc47695d1509'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "notes",
        sa.Column("sidenote", sa.Text(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("notes", "sidenote")
