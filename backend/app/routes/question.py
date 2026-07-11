from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.question import Question
from app.models.question_bank_set import QuestionBankSet
from app.models.question_library_subject import QuestionLibrarySubject
from app.models.user import User
from app.routes.auth import require_role
from app.schemas.question import (
    QuestionCreate,
    QuestionResponse,
    QuestionUpdate,
)

router = APIRouter()


SUPPORTED_QUESTION_TYPES = {
    "mcq",
    "multi_select",
    "true_false",
    "fill_blank",
    "numerical",
    "short_answer",
    "long_answer",
    "image_upload",
    "file_upload",
}


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def validate_question_data(question):
    question_type = question.question_type.strip().lower()

    if question_type not in SUPPORTED_QUESTION_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported question type",
        )

    difficulty = question.difficulty_level.strip().lower()

    if difficulty not in {"easy", "medium", "hard"}:
        raise HTTPException(
            status_code=400,
            detail="Difficulty must be Easy, Medium, or Hard",
        )

    if question_type in {"mcq", "multi_select"}:
        options = [
            question.option_a,
            question.option_b,
            question.option_c,
            question.option_d,
        ]

        if not all(option and option.strip() for option in options):
            raise HTTPException(
                status_code=400,
                detail="All four options are required for MCQ questions",
            )

        if not question.correct_answer or not question.correct_answer.strip():
            raise HTTPException(
                status_code=400,
                detail="Correct answer is required for MCQ questions",
            )

    if question_type == "true_false":
        answer = (question.correct_answer or "").strip().lower()

        if answer not in {"true", "false"}:
            raise HTTPException(
                status_code=400,
                detail="True/False answer must be either True or False",
            )

    if question_type in {
        "fill_blank",
        "numerical",
        "short_answer",
        "long_answer",
    }:
        if not question.correct_answer or not question.correct_answer.strip():
            raise HTTPException(
                status_code=400,
                detail="Correct answer or model answer is required",
            )


def validate_library_and_subject(
    bank_id: int,
    library_subject_id: int,
    db: Session,
):
    library = (
        db.query(QuestionBankSet)
        .filter(QuestionBankSet.bank_id == bank_id)
        .first()
    )

    if not library:
        raise HTTPException(
            status_code=404,
            detail="Question library not found",
        )

    library_subject = (
        db.query(QuestionLibrarySubject)
        .filter(
            QuestionLibrarySubject.library_subject_id
            == library_subject_id,
            QuestionLibrarySubject.bank_id == bank_id,
        )
        .first()
    )

    if not library_subject:
        raise HTTPException(
            status_code=400,
            detail="The selected subject does not belong to this question library",
        )

    return library_subject


@router.post(
    "/add-question",
    response_model=QuestionResponse,
    status_code=201,
)
def add_question(
    question: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    validate_question_data(question)

    library_subject = validate_library_and_subject(
        bank_id=question.bank_id,
        library_subject_id=question.library_subject_id,
        db=db,
    )

    question_type = question.question_type.strip().lower()

    new_question = Question(
        bank_id=question.bank_id,
        library_subject_id=question.library_subject_id,
        question_text=question.question_text.strip(),
        question_type=question_type,
        option_a=question.option_a.strip() if question.option_a else None,
        option_b=question.option_b.strip() if question.option_b else None,
        option_c=question.option_c.strip() if question.option_c else None,
        option_d=question.option_d.strip() if question.option_d else None,
        correct_answer=(
            question.correct_answer.strip()
            if question.correct_answer
            else None
        ),
        marks=question.marks,
        difficulty_level=question.difficulty_level.strip().title(),
        subject=library_subject.subject_name,
    )

    db.add(new_question)
    db.commit()
    db.refresh(new_question)

    return new_question


@router.get(
    "/all-questions",
    response_model=list[QuestionResponse],
)
def get_all_questions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    return (
        db.query(Question)
        .order_by(Question.questionbank_id.desc())
        .all()
    )


@router.get(
    "/library/{bank_id}",
    response_model=list[QuestionResponse],
)
def get_questions_by_library(
    bank_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    return (
        db.query(Question)
        .filter(Question.bank_id == bank_id)
        .order_by(Question.questionbank_id.desc())
        .all()
    )


@router.get(
    "/library/{bank_id}/subject/{library_subject_id}",
    response_model=list[QuestionResponse],
)
def get_questions_by_library_subject(
    bank_id: int,
    library_subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    validate_library_and_subject(
        bank_id=bank_id,
        library_subject_id=library_subject_id,
        db=db,
    )

    return (
        db.query(Question)
        .filter(
            Question.bank_id == bank_id,
            Question.library_subject_id == library_subject_id,
        )
        .order_by(Question.questionbank_id.desc())
        .all()
    )


@router.get(
    "/{question_id}",
    response_model=QuestionResponse,
)
def get_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    question = (
        db.query(Question)
        .filter(Question.questionbank_id == question_id)
        .first()
    )

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found",
        )

    return question


@router.put(
    "/update/{question_id}",
    response_model=QuestionResponse,
)
def update_question(
    question_id: int,
    updated_question: QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    question = (
        db.query(Question)
        .filter(Question.questionbank_id == question_id)
        .first()
    )

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found",
        )

    validate_question_data(updated_question)

    library_subject = validate_library_and_subject(
        bank_id=updated_question.bank_id,
        library_subject_id=updated_question.library_subject_id,
        db=db,
    )

    question.bank_id = updated_question.bank_id
    question.library_subject_id = updated_question.library_subject_id
    question.question_text = updated_question.question_text.strip()
    question.question_type = (
        updated_question.question_type.strip().lower()
    )

    question.option_a = (
        updated_question.option_a.strip()
        if updated_question.option_a
        else None
    )
    question.option_b = (
        updated_question.option_b.strip()
        if updated_question.option_b
        else None
    )
    question.option_c = (
        updated_question.option_c.strip()
        if updated_question.option_c
        else None
    )
    question.option_d = (
        updated_question.option_d.strip()
        if updated_question.option_d
        else None
    )

    question.correct_answer = (
        updated_question.correct_answer.strip()
        if updated_question.correct_answer
        else None
    )

    question.marks = updated_question.marks
    question.difficulty_level = (
        updated_question.difficulty_level.strip().title()
    )
    question.subject = library_subject.subject_name

    db.commit()
    db.refresh(question)

    return question


@router.delete("/delete/{question_id}")
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    question = (
        db.query(Question)
        .filter(Question.questionbank_id == question_id)
        .first()
    )

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found",
        )

    db.delete(question)
    db.commit()

    return {
        "message": "Question deleted successfully",
    }