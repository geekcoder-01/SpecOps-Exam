from sqlalchemy import Column, Integer, String, DateTime, ForeignKey

from app.database import Base


class ExamSession(Base):
    __tablename__ = "exam_sessions"

    session_id = Column(Integer, primary_key=True, index=True)

    student_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)

    exam_id = Column(Integer, ForeignKey("exams.exam_id"), nullable=False)

    start_time = Column(DateTime)

    end_time = Column(DateTime)

    status = Column(String(30), nullable=False)