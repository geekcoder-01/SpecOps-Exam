from typing import Optional

from pydantic import BaseModel, Field


class QuestionBankSetCreate(BaseModel):
    title: str = Field(min_length=2, max_length=150)
    subject: str = Field(min_length=2, max_length=100)
    purpose: Optional[str] = None


class QuestionBankSetUpdate(BaseModel):
    title: str = Field(min_length=2, max_length=150)
    subject: str = Field(min_length=2, max_length=100)
    purpose: Optional[str] = None


class QuestionBankSetResponse(BaseModel):
    bank_id: int
    title: str
    subject: str
    purpose: Optional[str] = None
    question_count: int = 0

    class Config:
        from_attributes = True