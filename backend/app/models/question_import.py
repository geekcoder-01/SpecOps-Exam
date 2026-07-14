from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text

from app.database import Base


class QuestionImport(Base):
    __tablename__ = "question_imports"

    import_id = Column(
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
            ondelete="CASCADE",
        ),
        nullable=False,
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

    original_filename = Column(
        String(255),
        nullable=False,
    )

    stored_filename = Column(
        String(255),
        unique=True,
        nullable=False,
    )

    file_type = Column(
        String(20),
        nullable=False,
    )

    file_path = Column(
        String(500),
        nullable=False,
    )

    file_size = Column(
        Integer,
        nullable=False,
    )

    status = Column(
        String(30),
        nullable=False,
        default="uploaded",
    )

    error_message = Column(
        Text,
        nullable=True,
    )

    extracted_text = Column(
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