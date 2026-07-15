"""add question library ownership and sharing

Revision ID: 82eb1224effb
Revises: 6c245922f81b
Create Date: 2026-07-16
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "82eb1224effb"
down_revision: Union[str, Sequence[str], None] = "6c245922f81b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "question_bank_sets",
        sa.Column(
            "created_by",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.add_column(
        "question_bank_sets",
        sa.Column(
            "visibility",
            sa.String(length=20),
            nullable=True,
        ),
    )

    op.execute(
        """
        UPDATE question_bank_sets
        SET visibility = 'private'
        WHERE visibility IS NULL
        """
    )

    op.alter_column(
        "question_bank_sets",
        "visibility",
        existing_type=sa.String(length=20),
        nullable=False,
        server_default="private",
    )

    op.create_index(
        op.f("ix_question_bank_sets_created_by"),
        "question_bank_sets",
        ["created_by"],
        unique=False,
    )

    op.create_foreign_key(
        None,
        "question_bank_sets",
        "users",
        ["created_by"],
        ["user_id"],
        ondelete="RESTRICT",
    )

    op.create_table(
        "question_library_members",
        sa.Column(
            "library_member_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "bank_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "examiner_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "permission",
            sa.String(length=20),
            nullable=False,
        ),
        sa.Column(
            "added_by",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "added_at",
            sa.DateTime(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["added_by"],
            ["users.user_id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["bank_id"],
            ["question_bank_sets.bank_id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["examiner_id"],
            ["users.user_id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("library_member_id"),
        sa.UniqueConstraint(
            "bank_id",
            "examiner_id",
            name="uq_question_library_member",
        ),
    )

    op.create_index(
        op.f(
            "ix_question_library_members_library_member_id"
        ),
        "question_library_members",
        ["library_member_id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_question_library_members_bank_id"),
        "question_library_members",
        ["bank_id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_question_library_members_examiner_id"),
        "question_library_members",
        ["examiner_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_question_library_members_examiner_id"),
        table_name="question_library_members",
    )

    op.drop_index(
        op.f("ix_question_library_members_bank_id"),
        table_name="question_library_members",
    )

    op.drop_index(
        op.f(
            "ix_question_library_members_library_member_id"
        ),
        table_name="question_library_members",
    )

    op.drop_table("question_library_members")

    op.drop_constraint(
        None,
        "question_bank_sets",
        type_="foreignkey",
    )

    op.drop_index(
        op.f("ix_question_bank_sets_created_by"),
        table_name="question_bank_sets",
    )

    op.drop_column(
        "question_bank_sets",
        "visibility",
    )

    op.drop_column(
        "question_bank_sets",
        "created_by",
    )