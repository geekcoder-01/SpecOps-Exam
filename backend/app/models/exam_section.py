from sqlalchemy import (
    Boolean,
    Column,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    text,
)

from app.database import Base


class ExamSection(Base):
    __tablename__ = "exam_sections"

    section_id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    exam_id = Column(
        Integer,
        ForeignKey(
            "exams.exam_id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    section_title = Column(
        String(150),
        nullable=False,
    )

    # Stored for display and compatibility.
    subject = Column(
        String(100),
        nullable=False,
    )

    bank_id = Column(
        Integer,
        ForeignKey(
            "question_bank_sets.bank_id",
            ondelete="RESTRICT",
        ),
        nullable=True,
        index=True,
    )

    library_subject_id = Column(
        Integer,
        ForeignKey(
            "question_library_subjects.library_subject_id",
            ondelete="RESTRICT",
        ),
        nullable=True,
        index=True,
    )

    section_order = Column(
        Integer,
        nullable=False,
        default=1,
        server_default="1",
    )

    question_limit = Column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    total_marks = Column(
        Float,
        nullable=False,
        default=0,
        server_default="0",
    )

    negative_marks = Column(
        Float,
        nullable=False,
        default=0,
        server_default="0",
    )

    randomize_questions = Column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("false"),
    )

    __table_args__ = (
        UniqueConstraint(
            "exam_id",
            "section_title",
            name="uq_exam_section_title",
        ),
    )