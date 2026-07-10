from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User
from app.routes.auth import require_role

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/students")
def get_all_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner"))
):
    students = db.query(User).filter(User.role.ilike("Student")).all()

    return [
        {
            "user_id": student.user_id,
            "name": student.name,
            "email": student.email,
            "role": student.role,
            "roll": student.roll,
            "created_at": student.created_at
        }
        for student in students
    ]