from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, model_validator


SUPPORTED_EXAM_TYPES = {
    "regular",
    "competitive",
    "entrance",
    "placement",
    "mock",
}

SUPPORTED_EXAM_STATUSES = {
    "draft",
    "published",
    "active",
    "completed",
    "cancelled",
}


class ExamBase(BaseModel):
    exam_name: str = Field(
        min_length=2,
        max_length=150,
    )

    exam_type: str = "regular"

    subject: Optional[str] = Field(
        default=None,
        max_length=100,
    )

    instructions: Optional[str] = None

    duration: int = Field(
        ge=1,
        le=1440,
    )

    start_time: datetime
    end_time: datetime

    total_marks: float = Field(
        default=0,
        ge=0,
    )

    passing_marks: float = Field(
        default=0,
        ge=0,
    )

    negative_marks: float = Field(
        default=0,
        ge=0,
    )

    randomize_questions: bool = False
    randomize_options: bool = False
    allow_calculator: bool = False

    require_fullscreen: bool = True
    browser_lock_enabled: bool = True

    camera_required: bool = True
    microphone_required: bool = False

    face_detection_enabled: bool = True
    multiple_face_detection_enabled: bool = True
    mobile_detection_enabled: bool = True
    tab_switch_detection_enabled: bool = True
    audio_detection_enabled: bool = False

    @model_validator(mode="after")
    def validate_exam(self):
        self.exam_name = self.exam_name.strip()
        self.exam_type = self.exam_type.strip().lower()

        if self.exam_type not in SUPPORTED_EXAM_TYPES:
            raise ValueError(
                "Exam type must be regular, competitive, "
                "entrance, placement, or mock"
            )

        if self.subject:
            self.subject = self.subject.strip() or None

        if self.instructions:
            self.instructions = (
                self.instructions.strip() or None
            )

        if self.end_time <= self.start_time:
            raise ValueError(
                "End time must be later than start time"
            )

        if (
            self.total_marks > 0
            and self.passing_marks > self.total_marks
        ):
            raise ValueError(
                "Passing marks cannot exceed total marks"
            )

        return self


class ExamCreate(ExamBase):
    pass


class ExamUpdate(ExamBase):
    pass


class ExamStatusUpdate(BaseModel):
    status: str

    @model_validator(mode="after")
    def validate_status(self):
        self.status = self.status.strip().lower()

        if self.status not in SUPPORTED_EXAM_STATUSES:
            raise ValueError(
                "Unsupported exam status"
            )

        return self


class ExamResponse(ExamBase):
    exam_id: int
    status: str
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    is_owner: bool = False

    class Config:
        from_attributes = True