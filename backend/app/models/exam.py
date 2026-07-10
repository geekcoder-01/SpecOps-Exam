from sqlalchemy import Column, Integer, String, Boolean, DateTime

from app.database import Base


class Exam(Base):
    __tablename__ = "exams"

    exam_id = Column(Integer, primary_key=True, index=True)

    exam_name = Column(String(100), nullable=False)

    subject = Column(String(100), nullable=False)

    duration = Column(Integer, nullable=False)

    start_time = Column(DateTime, nullable=False)

    end_time = Column(DateTime, nullable=False)

    negative_marks = Column(Integer, default=0)

    randomize_questions = Column(Boolean, default=False)