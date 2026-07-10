from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.exam import Exam
from app.schemas.exam import ExamCreate, ExamResponse

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/create", response_model=ExamResponse)
def create_exam(exam: ExamCreate, db: Session = Depends(get_db)):
    new_exam = Exam(**exam.model_dump())

    db.add(new_exam)
    db.commit()
    db.refresh(new_exam)

    return new_exam


@router.get("/all", response_model=list[ExamResponse])
def get_all_exams(db: Session = Depends(get_db)):
    return db.query(Exam).all()


@router.get("/{exam_id}", response_model=ExamResponse)
def get_exam(exam_id: int, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.exam_id == exam_id).first()

    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    return exam


@router.put("/update/{exam_id}", response_model=ExamResponse)
def update_exam(exam_id: int, updated_exam: ExamCreate, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.exam_id == exam_id).first()

    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    for key, value in updated_exam.model_dump().items():
        setattr(exam, key, value)

    db.commit()
    db.refresh(exam)

    return exam


@router.delete("/delete/{exam_id}")
def delete_exam(exam_id: int, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.exam_id == exam_id).first()

    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    db.delete(exam)
    db.commit()

    return {"message": "Exam deleted successfully"}