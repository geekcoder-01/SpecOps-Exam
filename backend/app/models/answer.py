from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey

from app.database import Base


class Answer(Base):
    __tablename__ = "answers"

    answer_id = Column(Integer, primary_key=True, index=True)

    student_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)

    question_id = Column(Integer, ForeignKey("question_bank.questionbank_id"), nullable=False)

    submitted_answer = Column(Text, nullable=False)

    submission_time = Column(DateTime)