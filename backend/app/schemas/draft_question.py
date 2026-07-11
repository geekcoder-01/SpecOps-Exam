from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class DraftQuestionCreate(BaseModel):
    bank_id: int
    library_subject_id: int
    import_id: Optional[int] = None

    source_type: str
    question_text: str = Field(min_length=2)
    question_type: str

    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None

    correct_answer: Optional[str] = None

    marks: int = Field(default=1, ge=1)
    difficulty_level: str = "Medium"
    confidence_score: Optional[int] = Field(
        default=None,
        ge=0,
        le=100,
    )


class DraftQuestionUpdate(BaseModel):
    question_text: str = Field(min_length=2)
    question_type: str

    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None

    correct_answer: Optional[str] = None

    marks: int = Field(ge=1)
    difficulty_level: str

    confidence_score: Optional[int] = Field(
        default=None,
        ge=0,
        le=100,
    )

    review_notes: Optional[str] = None


class DraftQuestionResponse(BaseModel):
    draft_id: int
    bank_id: int
    library_subject_id: int
    import_id: Optional[int] = None
    created_by: int

    source_type: str
    question_text: str
    question_type: str

    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None

    correct_answer: Optional[str] = None

    marks: int
    difficulty_level: str
    status: str

    confidence_score: Optional[int] = None
    review_notes: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True