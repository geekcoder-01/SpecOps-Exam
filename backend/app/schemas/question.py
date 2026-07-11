from typing import Optional

from pydantic import BaseModel, Field


class QuestionCreate(BaseModel):
    bank_id: int
    library_subject_id: int

    question_text: str = Field(min_length=2)
    question_type: str

    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None

    correct_answer: Optional[str] = None

    marks: int = Field(ge=1)
    difficulty_level: str
    subject: str


class QuestionUpdate(BaseModel):
    bank_id: int
    library_subject_id: int

    question_text: str = Field(min_length=2)
    question_type: str

    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None

    correct_answer: Optional[str] = None

    marks: int = Field(ge=1)
    difficulty_level: str
    subject: str


class QuestionResponse(BaseModel):
    questionbank_id: int

    bank_id: Optional[int] = None
    library_subject_id: Optional[int] = None

    question_text: str
    question_type: str

    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None

    correct_answer: Optional[str] = None

    marks: int
    difficulty_level: str
    subject: str

    class Config:
        from_attributes = True