from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    UniqueConstraint,
)

from app.database import Base


class ExamQuestion(Base):
    __tablename__ = "exam_questions"

    id = Column(
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

    section_id = Column(
        Integer,
        ForeignKey(
            "exam_sections.section_id",
            ondelete="CASCADE",
        ),
        nullable=True,
        index=True,
    )

    question_id = Column(
        Integer,
        ForeignKey(
            "question_bank.questionbank_id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    question_order = Column(
        Integer,
        nullable=False,
        default=1,
        server_default="1",
    )

    __table_args__ = (
        UniqueConstraint(
            "exam_id",
            "question_id",
            name="uq_exam_question",
        ),
    )