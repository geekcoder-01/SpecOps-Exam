"""expand exam builder foundation

Revision ID: 5d4001999634
Revises: 82eb1224effb
Create Date: 2026-07-16 12:05:17.224176
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "5d4001999634"
down_revision: Union[str, Sequence[str], None] = "82eb1224effb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new exam-builder fields with safe defaults for existing rows.
    op.add_column(
        "exams",
        sa.Column(
            "exam_type",
            sa.String(length=30),
            server_default="regular",
            nullable=False,
        ),
    )

    op.add_column(
        "exams",
        sa.Column(
            "instructions",
            sa.Text(),
            nullable=True,
        ),
    )

    op.add_column(
        "exams",
        sa.Column(
            "total_marks",
            sa.Float(),
            server_default="0",
            nullable=False,
        ),
    )

    op.add_column(
        "exams",
        sa.Column(
            "passing_marks",
            sa.Float(),
            server_default="0",
            nullable=False,
        ),
    )

    op.add_column(
        "exams",
        sa.Column(
            "randomize_options",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
    )

    op.add_column(
        "exams",
        sa.Column(
            "allow_calculator",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
    )

    op.add_column(
        "exams",
        sa.Column(
            "require_fullscreen",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
    )

    op.add_column(
        "exams",
        sa.Column(
            "browser_lock_enabled",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
    )

    op.add_column(
        "exams",
        sa.Column(
            "camera_required",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
    )

    op.add_column(
        "exams",
        sa.Column(
            "microphone_required",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
    )

    op.add_column(
        "exams",
        sa.Column(
            "face_detection_enabled",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
    )

    op.add_column(
        "exams",
        sa.Column(
            "multiple_face_detection_enabled",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
    )

    op.add_column(
        "exams",
        sa.Column(
            "mobile_detection_enabled",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
    )

    op.add_column(
        "exams",
        sa.Column(
            "tab_switch_detection_enabled",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
    )

    op.add_column(
        "exams",
        sa.Column(
            "audio_detection_enabled",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
    )

    op.add_column(
        "exams",
        sa.Column(
            "status",
            sa.String(length=20),
            server_default="draft",
            nullable=False,
        ),
    )

    # Nullable temporarily so existing exams can be assigned later.
    op.add_column(
        "exams",
        sa.Column(
            "created_by",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.add_column(
        "exams",
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
    )

    op.add_column(
        "exams",
        sa.Column(
            "updated_at",
            sa.DateTime(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
    )

    # Clean old nullable data before enforcing NOT NULL.
    op.execute(
        """
        UPDATE exams
        SET negative_marks = 0
        WHERE negative_marks IS NULL
        """
    )

    op.execute(
        """
        UPDATE exams
        SET randomize_questions = false
        WHERE randomize_questions IS NULL
        """
    )

    op.alter_column(
        "exams",
        "exam_name",
        existing_type=sa.VARCHAR(length=100),
        type_=sa.String(length=150),
        existing_nullable=False,
    )

    op.alter_column(
        "exams",
        "subject",
        existing_type=sa.VARCHAR(length=100),
        nullable=True,
    )

    op.alter_column(
        "exams",
        "negative_marks",
        existing_type=sa.Integer(),
        type_=sa.Float(),
        existing_nullable=True,
        nullable=False,
        server_default="0",
    )

    op.alter_column(
        "exams",
        "randomize_questions",
        existing_type=sa.Boolean(),
        existing_nullable=True,
        nullable=False,
        server_default=sa.text("false"),
    )

    op.create_index(
        op.f("ix_exams_created_by"),
        "exams",
        ["created_by"],
        unique=False,
    )

    op.create_index(
        op.f("ix_exams_status"),
        "exams",
        ["status"],
        unique=False,
    )

    op.create_foreign_key(
        "fk_exams_created_by_users",
        "exams",
        "users",
        ["created_by"],
        ["user_id"],
        ondelete="RESTRICT",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_exams_created_by_users",
        "exams",
        type_="foreignkey",
    )

    op.drop_index(
        op.f("ix_exams_status"),
        table_name="exams",
    )

    op.drop_index(
        op.f("ix_exams_created_by"),
        table_name="exams",
    )

    op.alter_column(
        "exams",
        "randomize_questions",
        existing_type=sa.Boolean(),
        nullable=True,
        server_default=None,
    )

    op.alter_column(
        "exams",
        "negative_marks",
        existing_type=sa.Float(),
        type_=sa.Integer(),
        nullable=True,
        server_default=None,
    )

    op.alter_column(
        "exams",
        "subject",
        existing_type=sa.VARCHAR(length=100),
        nullable=False,
    )

    op.alter_column(
        "exams",
        "exam_name",
        existing_type=sa.String(length=150),
        type_=sa.VARCHAR(length=100),
        existing_nullable=False,
    )

    op.drop_column("exams", "updated_at")
    op.drop_column("exams", "created_at")
    op.drop_column("exams", "created_by")
    op.drop_column("exams", "status")
    op.drop_column("exams", "audio_detection_enabled")
    op.drop_column("exams", "tab_switch_detection_enabled")
    op.drop_column("exams", "mobile_detection_enabled")
    op.drop_column(
        "exams",
        "multiple_face_detection_enabled",
    )
    op.drop_column("exams", "face_detection_enabled")
    op.drop_column("exams", "microphone_required")
    op.drop_column("exams", "camera_required")
    op.drop_column("exams", "browser_lock_enabled")
    op.drop_column("exams", "require_fullscreen")
    op.drop_column("exams", "allow_calculator")
    op.drop_column("exams", "randomize_options")
    op.drop_column("exams", "passing_marks")
    op.drop_column("exams", "total_marks")
    op.drop_column("exams", "instructions")
    op.drop_column("exams", "exam_type")