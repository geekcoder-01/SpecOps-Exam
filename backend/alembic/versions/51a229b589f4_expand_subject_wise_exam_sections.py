"""expand subject wise exam sections

Revision ID: 51a229b589f4
Revises: ccd7ee215f93
Create Date: 2026-07-17 15:12:21.094524
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "51a229b589f4"
down_revision: Union[str, Sequence[str], None] = "ccd7ee215f93"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ---------------------------------------------------------
    # Exam sections
    # ---------------------------------------------------------

    op.add_column(
        "exam_sections",
        sa.Column(
            "bank_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.add_column(
        "exam_sections",
        sa.Column(
            "library_subject_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.add_column(
        "exam_sections",
        sa.Column(
            "section_order",
            sa.Integer(),
            server_default="1",
            nullable=False,
        ),
    )

    op.add_column(
        "exam_sections",
        sa.Column(
            "question_limit",
            sa.Integer(),
            server_default="0",
            nullable=False,
        ),
    )

    op.add_column(
        "exam_sections",
        sa.Column(
            "total_marks",
            sa.Float(),
            server_default="0",
            nullable=False,
        ),
    )

    op.add_column(
        "exam_sections",
        sa.Column(
            "negative_marks",
            sa.Float(),
            server_default="0",
            nullable=False,
        ),
    )

    op.add_column(
        "exam_sections",
        sa.Column(
            "randomize_questions",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
    )

    # Make old duplicate section titles unique before adding
    # the database constraint.
    op.execute(
        """
        WITH duplicate_sections AS (
            SELECT
                section_id,
                ROW_NUMBER() OVER (
                    PARTITION BY exam_id, LOWER(section_title)
                    ORDER BY section_id
                ) AS duplicate_number
            FROM exam_sections
        )
        UPDATE exam_sections AS section
        SET section_title =
            section.section_title
            || ' ('
            || duplicate_sections.duplicate_number
            || ')'
        FROM duplicate_sections
        WHERE
            section.section_id =
                duplicate_sections.section_id
            AND duplicate_sections.duplicate_number > 1
        """
    )

    op.create_index(
        op.f("ix_exam_sections_bank_id"),
        "exam_sections",
        ["bank_id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_exam_sections_exam_id"),
        "exam_sections",
        ["exam_id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_exam_sections_library_subject_id"),
        "exam_sections",
        ["library_subject_id"],
        unique=False,
    )

    op.create_unique_constraint(
        "uq_exam_section_title",
        "exam_sections",
        ["exam_id", "section_title"],
    )

    # Replace the original exam foreign key so cascade deletion
    # matches the current model.
    op.drop_constraint(
        "exam_sections_exam_id_fkey",
        "exam_sections",
        type_="foreignkey",
    )

    op.create_foreign_key(
        "fk_exam_sections_exam_id",
        "exam_sections",
        "exams",
        ["exam_id"],
        ["exam_id"],
        ondelete="CASCADE",
    )

    op.create_foreign_key(
        "fk_exam_sections_bank_id",
        "exam_sections",
        "question_bank_sets",
        ["bank_id"],
        ["bank_id"],
        ondelete="RESTRICT",
    )

    op.create_foreign_key(
        "fk_exam_sections_library_subject_id",
        "exam_sections",
        "question_library_subjects",
        ["library_subject_id"],
        ["library_subject_id"],
        ondelete="RESTRICT",
    )

    # ---------------------------------------------------------
    # Exam questions
    # ---------------------------------------------------------

    op.add_column(
        "exam_questions",
        sa.Column(
            "section_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.add_column(
        "exam_questions",
        sa.Column(
            "question_order",
            sa.Integer(),
            server_default="1",
            nullable=False,
        ),
    )

    # Remove duplicate question assignments before adding the
    # unique exam/question constraint.
    op.execute(
        """
        DELETE FROM exam_questions
        WHERE id IN (
            SELECT id
            FROM (
                SELECT
                    id,
                    ROW_NUMBER() OVER (
                        PARTITION BY exam_id, question_id
                        ORDER BY id
                    ) AS duplicate_number
                FROM exam_questions
            ) AS duplicate_questions
            WHERE duplicate_number > 1
        )
        """
    )

    op.create_index(
        op.f("ix_exam_questions_exam_id"),
        "exam_questions",
        ["exam_id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_exam_questions_question_id"),
        "exam_questions",
        ["question_id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_exam_questions_section_id"),
        "exam_questions",
        ["section_id"],
        unique=False,
    )

    op.create_unique_constraint(
        "uq_exam_question",
        "exam_questions",
        ["exam_id", "question_id"],
    )

    op.drop_constraint(
        "exam_questions_exam_id_fkey",
        "exam_questions",
        type_="foreignkey",
    )

    op.drop_constraint(
        "exam_questions_question_id_fkey",
        "exam_questions",
        type_="foreignkey",
    )

    op.create_foreign_key(
        "fk_exam_questions_exam_id",
        "exam_questions",
        "exams",
        ["exam_id"],
        ["exam_id"],
        ondelete="CASCADE",
    )

    op.create_foreign_key(
        "fk_exam_questions_section_id",
        "exam_questions",
        "exam_sections",
        ["section_id"],
        ["section_id"],
        ondelete="CASCADE",
    )

    op.create_foreign_key(
        "fk_exam_questions_question_id",
        "exam_questions",
        "question_bank",
        ["question_id"],
        ["questionbank_id"],
        ondelete="RESTRICT",
    )


def downgrade() -> None:
    # ---------------------------------------------------------
    # Exam questions
    # ---------------------------------------------------------

    op.drop_constraint(
        "fk_exam_questions_question_id",
        "exam_questions",
        type_="foreignkey",
    )

    op.drop_constraint(
        "fk_exam_questions_section_id",
        "exam_questions",
        type_="foreignkey",
    )

    op.drop_constraint(
        "fk_exam_questions_exam_id",
        "exam_questions",
        type_="foreignkey",
    )

    op.create_foreign_key(
        "exam_questions_exam_id_fkey",
        "exam_questions",
        "exams",
        ["exam_id"],
        ["exam_id"],
    )

    op.create_foreign_key(
        "exam_questions_question_id_fkey",
        "exam_questions",
        "question_bank",
        ["question_id"],
        ["questionbank_id"],
    )

    op.drop_constraint(
        "uq_exam_question",
        "exam_questions",
        type_="unique",
    )

    op.drop_index(
        op.f("ix_exam_questions_section_id"),
        table_name="exam_questions",
    )

    op.drop_index(
        op.f("ix_exam_questions_question_id"),
        table_name="exam_questions",
    )

    op.drop_index(
        op.f("ix_exam_questions_exam_id"),
        table_name="exam_questions",
    )

    op.drop_column(
        "exam_questions",
        "question_order",
    )

    op.drop_column(
        "exam_questions",
        "section_id",
    )

    # ---------------------------------------------------------
    # Exam sections
    # ---------------------------------------------------------

    op.drop_constraint(
        "fk_exam_sections_library_subject_id",
        "exam_sections",
        type_="foreignkey",
    )

    op.drop_constraint(
        "fk_exam_sections_bank_id",
        "exam_sections",
        type_="foreignkey",
    )

    op.drop_constraint(
        "fk_exam_sections_exam_id",
        "exam_sections",
        type_="foreignkey",
    )

    op.create_foreign_key(
        "exam_sections_exam_id_fkey",
        "exam_sections",
        "exams",
        ["exam_id"],
        ["exam_id"],
    )

    op.drop_constraint(
        "uq_exam_section_title",
        "exam_sections",
        type_="unique",
    )

    op.drop_index(
        op.f("ix_exam_sections_library_subject_id"),
        table_name="exam_sections",
    )

    op.drop_index(
        op.f("ix_exam_sections_exam_id"),
        table_name="exam_sections",
    )

    op.drop_index(
        op.f("ix_exam_sections_bank_id"),
        table_name="exam_sections",
    )

    op.drop_column(
        "exam_sections",
        "randomize_questions",
    )

    op.drop_column(
        "exam_sections",
        "negative_marks",
    )

    op.drop_column(
        "exam_sections",
        "total_marks",
    )

    op.drop_column(
        "exam_sections",
        "question_limit",
    )

    op.drop_column(
        "exam_sections",
        "section_order",
    )

    op.drop_column(
        "exam_sections",
        "library_subject_id",
    )

    op.drop_column(
        "exam_sections",
        "bank_id",
    )