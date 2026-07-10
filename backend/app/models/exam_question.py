from sqlalchemy import Column, Integer, ForeignKey

from app.database import Base


class ExamQuestion(Base):
    __tablename__ = "exam_questions"

    id = Column(Integer, primary_key=True, index=True)

    exam_id = Column(
        Integer,
        ForeignKey("exams.exam_id"),
        nullable=False
    )

    question_id = Column(
        Integer,
        ForeignKey("question_bank.questionbank_id"),
        nullable=False
    )