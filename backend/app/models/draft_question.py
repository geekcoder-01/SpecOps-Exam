from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text

from app.database import Base


class DraftQuestion(Base):
    __tablename__ = "draft_questions"

    draft_id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    bank_id = Column(
        Integer,
        ForeignKey(
            "question_bank_sets.bank_id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    library_subject_id = Column(
        Integer,
        ForeignKey(
            "question_library_subjects.library_subject_id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    import_id = Column(
        Integer,
        ForeignKey(
            "question_imports.import_id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    created_by = Column(
        Integer,
        ForeignKey(
            "users.user_id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    source_type = Column(
        String(30),
        nullable=False,
    )

    question_text = Column(
        Text,
        nullable=False,
    )

    question_type = Column(
        String(30),
        nullable=False,
    )

    option_a = Column(Text, nullable=True)
    option_b = Column(Text, nullable=True)
    option_c = Column(Text, nullable=True)
    option_d = Column(Text, nullable=True)

    correct_answer = Column(
        Text,
        nullable=True,
    )

    marks = Column(
        Integer,
        nullable=False,
        default=1,
    )

    difficulty_level = Column(
        String(20),
        nullable=False,
        default="Medium",
    )

    status = Column(
        String(20),
        nullable=False,
        default="pending",
    )

    confidence_score = Column(
        Integer,
        nullable=True,
    )

    review_notes = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )