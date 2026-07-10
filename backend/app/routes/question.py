from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.question import Question
from app.schemas.question import QuestionCreate, QuestionResponse

router = APIRouter()


# Database Session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Add Question
@router.post("/add-question", response_model=QuestionResponse)
def add_question(question: QuestionCreate, db: Session = Depends(get_db)):

    new_question = Question(
        question_text=question.question_text,
        question_type=question.question_type,

        option_a=question.option_a,
        option_b=question.option_b,
        option_c=question.option_c,
        option_d=question.option_d,

        correct_answer=question.correct_answer,

        marks=question.marks,
        difficulty_level=question.difficulty_level,
        subject=question.subject
    )

    db.add(new_question)
    db.commit()
    db.refresh(new_question)

    return new_question


# Get All Questions
@router.get("/all-questions", response_model=list[QuestionResponse])
def get_all_questions(db: Session =Depends(get_db)):

    return db.query(Question).all()


# Get Question By ID
@router.get("/{question_id}", response_model=QuestionResponse)
def get_question(question_id: int, db: Session = Depends(get_db)):

    question = db.query(Question).filter(
        Question.questionbank_id == question_id
    ).first()

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found"
        )

    return question


# Update Question
@router.put("/update/{question_id}", response_model=QuestionResponse)
def update_question(
    question_id: int,
    updated_question: QuestionCreate,
    db: Session = Depends(get_db)
):

    question = db.query(Question).filter(
        Question.questionbank_id == question_id
    ).first()

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found"
        )

    question.question_text = updated_question.question_text
    question.question_type = updated_question.question_type

    question.option_a = updated_question.option_a
    question.option_b = updated_question.option_b
    question.option_c = updated_question.option_c
    question.option_d = updated_question.option_d

    question.correct_answer = updated_question.correct_answer

    question.marks = updated_question.marks
    question.difficulty_level = updated_question.difficulty_level
    question.subject = updated_question.subject

    db.commit()
    db.refresh(question)

    return question


# Delete Question
@router.delete("/delete/{question_id}")
def delete_question(question_id: int, db: Session = Depends(get_db)):

    question = db.query(Question).filter(
        Question.questionbank_id == question_id
    ).first()

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found"
        )

    db.delete(question)
    db.commit()

    return {
        "message": "Question deleted successfully"
    }