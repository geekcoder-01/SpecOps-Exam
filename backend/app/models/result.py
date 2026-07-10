from sqlalchemy import Column, Integer, Float, Text, ForeignKey

from app.database import Base


class Result(Base):
    __tablename__ = "results"

    result_id = Column(Integer, primary_key=True, index=True)

    student_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)

    exam_id = Column(Integer, ForeignKey("exams.exam_id"), nullable=False)

    total_marks = Column(Float, nullable=False)

    ai_score = Column(Float, nullable=False)

    final_examiner_score = Column(Float, nullable=False)

    feedback = Column(Text)