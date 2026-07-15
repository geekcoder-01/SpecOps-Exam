from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)

from app.database import Base


class QuestionLibraryMember(Base):
    __tablename__ = "question_library_members"

    library_member_id = Column(
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

    examiner_id = Column(
        Integer,
        ForeignKey(
            "users.user_id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    permission = Column(
        String(20),
        nullable=False,
        default="editor",
    )

    added_by = Column(
        Integer,
        ForeignKey(
            "users.user_id",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    added_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "bank_id",
            "examiner_id",
            name="uq_question_library_member",
        ),
    )