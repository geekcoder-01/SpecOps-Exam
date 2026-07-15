from sqlalchemy import Column, ForeignKey, Integer, String, Text

from app.database import Base


class QuestionBankSet(Base):
    __tablename__ = "question_bank_sets"

    bank_id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    title = Column(
        String(150),
        nullable=False,
    )

    # Legacy field retained temporarily.
    subject = Column(
        String(100),
        nullable=True,
    )

    purpose = Column(
        Text,
        nullable=True,
    )

    created_by = Column(
        Integer,
        ForeignKey(
            "users.user_id",
            ondelete="RESTRICT",
        ),
        nullable=True,
        index=True,
    )

    visibility = Column(
        String(20),
        nullable=False,
        default="private",
    )