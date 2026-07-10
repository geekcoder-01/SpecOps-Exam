from sqlalchemy import Column, Integer, String, Text

from app.database import Base


class QuestionBankSet(Base):
    __tablename__ = "question_bank_sets"

    bank_id = Column(Integer, primary_key=True, index=True)

    title = Column(String(150), nullable=False)

    subject = Column(String(100), nullable=False)

    purpose = Column(Text, nullable=True)