from sqlalchemy import Column, ForeignKey, Integer, String, UniqueConstraint

from app.database import Base


class QuestionLibrarySubject(Base):
    __tablename__ = "question_library_subjects"

    library_subject_id = Column(
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

    subject_name = Column(
        String(100),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "bank_id",
            "subject_name",
            name="uq_library_subject",
        ),
    )