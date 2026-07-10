from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.student_exam import StudentExam
from app.models.exam import Exam
from app.models.user import User
from app.routes.auth import get_current_user, require_role

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/assign")
def assign_exam_to_student(
    student_id: int,
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner"))
):
    student = db.query(User).filter(
        User.user_id == student_id,
        User.role.ilike("Student")
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    exam = db.query(Exam).filter(Exam.exam_id == exam_id).first()

    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    existing = db.query(StudentExam).filter(
        StudentExam.student_id == student_id,
        StudentExam.exam_id == exam_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Exam already assigned to student")

    assigned_exam = StudentExam(
        student_id=student_id,
        exam_id=exam_id
    )

    db.add(assigned_exam)
    db.commit()
    db.refresh(assigned_exam)

    return {
        "message": "Exam assigned successfully"
    }


@router.get("/my-exams")
def get_my_assigned_exams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assigned = db.query(StudentExam).filter(
        StudentExam.student_id == current_user.user_id
    ).all()

    exam_ids = [item.exam_id for item in assigned]

    exams = db.query(Exam).filter(Exam.exam_id.in_(exam_ids)).all()

    return exams