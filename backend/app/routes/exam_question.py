from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.exam_question import ExamQuestion
from app.models.exam import Exam
from app.models.question import Question
from app.models.user import User
from app.routes.auth import require_role, get_current_user

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/assign")
def assign_question_to_exam(
    exam_id: int,
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner"))
):
    exam = db.query(Exam).filter(Exam.exam_id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    question = db.query(Question).filter(
        Question.questionbank_id == question_id
    ).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    existing = db.query(ExamQuestion).filter(
        ExamQuestion.exam_id == exam_id,
        ExamQuestion.question_id == question_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Question already assigned")

    exam_question = ExamQuestion(
        exam_id=exam_id,
        question_id=question_id
    )

    db.add(exam_question)
    db.commit()

    return {"message": "Question assigned to exam successfully"}


@router.get("/exam/{exam_id}")
def get_questions_for_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assigned = db.query(ExamQuestion).filter(
        ExamQuestion.exam_id == exam_id
    ).all()

    question_ids = [item.question_id for item in assigned]

    questions = db.query(Question).filter(
        Question.questionbank_id.in_(question_ids)
    ).all()

    return questions