from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ExamCreate(BaseModel):
    exam_name: str
    subject: str
    duration: int
    start_time: datetime
    end_time: datetime
    negative_marks: Optional[int] = 0
    randomize_questions: Optional[bool] = False


class ExamResponse(BaseModel):
    exam_id: int
    exam_name: str
    subject: str
    duration: int
    start_time: datetime
    end_time: datetime
    negative_marks: int
    randomize_questions: bool

    class Config:
        from_attributes = True