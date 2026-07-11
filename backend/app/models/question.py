from sqlalchemy import Column, ForeignKey, Integer, String, Text

from app.database import Base


class Question(Base):
    __tablename__ = "question_bank"

    questionbank_id = Column(
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

    # MCQ, numerical, and descriptive questions may use this.
    # Upload-answer questions do not require a correct answer.
    correct_answer = Column(
        Text,
        nullable=True,
    )

    marks = Column(
        Integer,
        nullable=False,
    )

    difficulty_level = Column(
        String(20),
        nullable=False,
    )

    # Legacy compatibility field.
    # New questions use library_subject_id as the source of truth.
    # We will remove this column in a later cleanup migration.
    subject = Column(
        String(100),
        nullable=True,
    )   