from sqlalchemy import Column, Integer, String, ForeignKey

from app.database import Base


class ExamSection(Base):
    __tablename__ = "exam_sections"

    section_id = Column(Integer, primary_key=True, index=True)

    exam_id = Column(Integer, ForeignKey("exams.exam_id"), nullable=False)

    subject = Column(String(100), nullable=False)

    section_title = Column(String(150), nullable=False)