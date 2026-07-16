"""add user approval workflow

Revision ID: ccd7ee215f93
Revises: 5d4001999634
Create Date: 2026-07-16 19:17:39.807280
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "ccd7ee215f93"
down_revision: Union[str, Sequence[str], None] = "5d4001999634"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add status as nullable first so existing users can be migrated safely.
    op.add_column(
        "users",
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=True,
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "approved_by",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "approved_at",
            sa.DateTime(),
            nullable=True,
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "rejection_reason",
            sa.Text(),
            nullable=True,
        ),
    )

    # Preserve all existing accounts by approving them.
    op.execute(
        """
        UPDATE users
        SET status = 'approved'
        WHERE status IS NULL
        """
    )

    # Repair any old rows with a missing creation timestamp.
    op.execute(
        """
        UPDATE users
        SET created_at = CURRENT_TIMESTAMP
        WHERE created_at IS NULL
        """
    )

    # New registrations will default to pending.
    op.alter_column(
        "users",
        "status",
        existing_type=sa.String(length=20),
        nullable=False,
        server_default="pending",
    )

    op.alter_column(
        "users",
        "created_at",
        existing_type=postgresql.TIMESTAMP(),
        nullable=False,
        server_default=sa.text("CURRENT_TIMESTAMP"),
    )

    op.create_index(
        op.f("ix_users_approved_by"),
        "users",
        ["approved_by"],
        unique=False,
    )

    op.create_index(
        op.f("ix_users_role"),
        "users",
        ["role"],
        unique=False,
    )

    op.create_index(
        op.f("ix_users_status"),
        "users",
        ["status"],
        unique=False,
    )

    op.create_foreign_key(
        "fk_users_approved_by_users",
        "users",
        "users",
        ["approved_by"],
        ["user_id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_users_approved_by_users",
        "users",
        type_="foreignkey",
    )

    op.drop_index(
        op.f("ix_users_status"),
        table_name="users",
    )

    op.drop_index(
        op.f("ix_users_role"),
        table_name="users",
    )

    op.drop_index(
        op.f("ix_users_approved_by"),
        table_name="users",
    )

    op.alter_column(
        "users",
        "created_at",
        existing_type=postgresql.TIMESTAMP(),
        nullable=True,
        server_default=None,
    )

    op.drop_column(
        "users",
        "rejection_reason",
    )

    op.drop_column(
        "users",
        "approved_at",
    )

    op.drop_column(
        "users",
        "approved_by",
    )

    op.drop_column(
        "users",
        "status",
    )