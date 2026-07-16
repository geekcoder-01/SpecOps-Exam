from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    text,
)

from app.database import Base


class Exam(Base):
    __tablename__ = "exams"

    exam_id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    exam_name = Column(
        String(150),
        nullable=False,
    )

    # regular, competitive, entrance, placement, mock
    exam_type = Column(
        String(30),
        nullable=False,
        default="regular",
        server_default="regular",
    )

    # Retained temporarily for compatibility with existing exams.
    # Multi-subject exams will use exam_sections.
    subject = Column(
        String(100),
        nullable=True,
    )

    instructions = Column(
        Text,
        nullable=True,
    )

    duration = Column(
        Integer,
        nullable=False,
    )

    start_time = Column(
        DateTime,
        nullable=False,
    )

    end_time = Column(
        DateTime,
        nullable=False,
    )

    total_marks = Column(
        Float,
        nullable=False,
        default=0,
        server_default="0",
    )

    passing_marks = Column(
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

    randomize_options = Column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("false"),
    )

    allow_calculator = Column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("false"),
    )

    require_fullscreen = Column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("true"),
    )

    browser_lock_enabled = Column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("true"),
    )

    camera_required = Column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("true"),
    )

    microphone_required = Column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("false"),
    )

    face_detection_enabled = Column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("true"),
    )

    multiple_face_detection_enabled = Column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("true"),
    )

    mobile_detection_enabled = Column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("true"),
    )

    tab_switch_detection_enabled = Column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("true"),
    )

    audio_detection_enabled = Column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("false"),
    )

    # draft, published, active, completed, cancelled
    status = Column(
        String(20),
        nullable=False,
        default="draft",
        server_default="draft",
        index=True,
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

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        server_default=text("CURRENT_TIMESTAMP"),
    )