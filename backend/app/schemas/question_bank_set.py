from typing import Optional

from pydantic import BaseModel, Field


class QuestionBankSetCreate(BaseModel):
    title: str = Field(
        min_length=2,
        max_length=150,
    )

    purpose: Optional[str] = Field(
        default=None,
        max_length=500,
    )


class QuestionBankSetUpdate(BaseModel):
    title: str = Field(
        min_length=2,
        max_length=150,
    )

    purpose: Optional[str] = Field(
        default=None,
        max_length=500,
    )


class QuestionBankSetResponse(BaseModel):
    bank_id: int
    title: str
    purpose: Optional[str] = None
    question_count: int = 0

    class Config:
        from_attributes = True