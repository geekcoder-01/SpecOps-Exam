from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.exam import Exam
from app.models.user import User


def get_exam_or_404(
    exam_id: int,
    db: Session,
) -> Exam:
    exam = (
        db.query(Exam)
        .filter(Exam.exam_id == exam_id)
        .first()
    )

    if not exam:
        raise HTTPException(
            status_code=404,
            detail="Exam not found",
        )

    return exam


def require_exam_owner(
    exam_id: int,
    current_user: User,
    db: Session,
) -> Exam:
    exam = get_exam_or_404(exam_id, db)

    if exam.created_by != current_user.user_id:
        raise HTTPException(
            status_code=403,
            detail="Only the exam owner can modify this exam",
        )

    return exam