from sqlalchemy import Column, Integer, ForeignKey

from app.database import Base


class StudentExam(Base):
    __tablename__ = "student_exams"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)

    exam_id = Column(Integer, ForeignKey("exams.exam_id"), nullable=False)