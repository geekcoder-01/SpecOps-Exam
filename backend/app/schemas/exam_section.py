from typing import Optional

from pydantic import BaseModel, Field, model_validator


class ExamSectionCreate(BaseModel):
    section_title: str = Field(
        min_length=2,
        max_length=150,
    )

    bank_id: int = Field(gt=0)
    library_subject_id: int = Field(gt=0)

    section_order: int = Field(
        default=1,
        ge=1,
    )

    question_limit: int = Field(
        default=0,
        ge=0,
    )

    total_marks: float = Field(
        default=0,
        ge=0,
    )

    negative_marks: float = Field(
        default=0,
        ge=0,
    )

    randomize_questions: bool = False

    @model_validator(mode="after")
    def clean_values(self):
        self.section_title = self.section_title.strip()
        return self


class ExamSectionUpdate(BaseModel):
    section_title: str = Field(
        min_length=2,
        max_length=150,
    )

    bank_id: int = Field(gt=0)
    library_subject_id: int = Field(gt=0)

    section_order: int = Field(
        default=1,
        ge=1,
    )

    question_limit: int = Field(
        default=0,
        ge=0,
    )

    total_marks: float = Field(
        default=0,
        ge=0,
    )

    negative_marks: float = Field(
        default=0,
        ge=0,
    )

    randomize_questions: bool = False

    @model_validator(mode="after")
    def clean_values(self):
        self.section_title = self.section_title.strip()
        return self


class ExamSectionResponse(BaseModel):
    section_id: int
    exam_id: int
    section_title: str
    subject: str

    bank_id: Optional[int] = None
    library_subject_id: Optional[int] = None

    section_order: int
    question_limit: int
    total_marks: float
    negative_marks: float
    randomize_questions: bool

    question_count: int = 0
    library_title: Optional[str] = None

    class Config:
        from_attributes = True