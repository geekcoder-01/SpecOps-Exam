from typing import Optional
from pydantic import BaseModel


class QuestionCreate(BaseModel):
    question_text: str
    question_type: str

    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None

    correct_answer: str

    marks: int
    difficulty_level: str
    subject: str


class QuestionResponse(BaseModel):
    questionbank_id: int
    question_text: str
    question_type: str

    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None

    correct_answer: str

    marks: int
    difficulty_level: str
    subject: str

    class Config:
        from_attributes = True