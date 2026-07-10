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
        nullable=True,
        index=True,
    )

    library_subject_id = Column(
        Integer,
        ForeignKey(
            "question_library_subjects.library_subject_id",
            ondelete="SET NULL",
        ),
        nullable=True,
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

    correct_answer = Column(
        Text,
        nullable=False,
    )

    marks = Column(
        Integer,
        nullable=False,
    )

    difficulty_level = Column(
        String(20),
        nullable=False,
    )

    subject = Column(
        String(100),
        nullable=False,
    )