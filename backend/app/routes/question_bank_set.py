from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.question import Question
from app.models.question_bank_set import QuestionBankSet
from app.models.user import User
from app.routes.auth import require_role
from app.schemas.question_bank_set import (
    QuestionBankSetCreate,
    QuestionBankSetUpdate,
)

router = APIRouter()


def serialize_bank(
    bank: QuestionBankSet,
    question_count: int = 0,
):
    return {
        "bank_id": bank.bank_id,
        "title": bank.title,
        "purpose": bank.purpose,
        "question_count": question_count or 0,
    }


def get_bank_or_404(
    bank_id: int,
    db: Session,
):
    bank = (
        db.query(QuestionBankSet)
        .filter(QuestionBankSet.bank_id == bank_id)
        .first()
    )

    if not bank:
        raise HTTPException(
            status_code=404,
            detail="Question library not found",
        )

    return bank


@router.post("/create", status_code=201)
def create_question_library(
    data: QuestionBankSetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    title = data.title.strip()

    existing = (
        db.query(QuestionBankSet)
        .filter(
            func.lower(QuestionBankSet.title)
            == title.lower()
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="A question library with this title already exists",
        )

    bank = QuestionBankSet(
        title=title,
        subject=None,
        purpose=(
            data.purpose.strip()
            if data.purpose and data.purpose.strip()
            else None
        ),
    )

    db.add(bank)
    db.commit()
    db.refresh(bank)

    return serialize_bank(bank)


@router.get("/all")
def get_all_question_libraries(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    records = (
        db.query(
            QuestionBankSet,
            func.count(
                Question.questionbank_id
            ).label("question_count"),
        )
        .outerjoin(
            Question,
            Question.bank_id == QuestionBankSet.bank_id,
        )
        .group_by(QuestionBankSet.bank_id)
        .order_by(QuestionBankSet.bank_id.desc())
        .all()
    )

    return [
        serialize_bank(bank, question_count)
        for bank, question_count in records
    ]


@router.get("/{bank_id}")
def get_question_library(
    bank_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    bank = get_bank_or_404(bank_id, db)

    question_count = (
        db.query(
            func.count(Question.questionbank_id)
        )
        .filter(Question.bank_id == bank_id)
        .scalar()
        or 0
    )

    questions = (
        db.query(Question)
        .filter(Question.bank_id == bank_id)
        .order_by(Question.questionbank_id.desc())
        .all()
    )

    return {
        **serialize_bank(bank, question_count),
        "questions": questions,
    }


@router.put("/{bank_id}")
def update_question_library(
    bank_id: int,
    data: QuestionBankSetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    bank = get_bank_or_404(bank_id, db)

    title = data.title.strip()

    duplicate = (
        db.query(QuestionBankSet)
        .filter(
            func.lower(QuestionBankSet.title)
            == title.lower(),
            QuestionBankSet.bank_id != bank_id,
        )
        .first()
    )

    if duplicate:
        raise HTTPException(
            status_code=400,
            detail="A question library with this title already exists",
        )

    bank.title = title
    bank.subject = None
    bank.purpose = (
        data.purpose.strip()
        if data.purpose and data.purpose.strip()
        else None
    )

    db.commit()
    db.refresh(bank)

    question_count = (
        db.query(
            func.count(Question.questionbank_id)
        )
        .filter(Question.bank_id == bank_id)
        .scalar()
        or 0
    )

    return serialize_bank(bank, question_count)


@router.delete("/{bank_id}")
def delete_question_library(
    bank_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    bank = get_bank_or_404(bank_id, db)

    question_count = (
        db.query(
            func.count(Question.questionbank_id)
        )
        .filter(Question.bank_id == bank_id)
        .scalar()
        or 0
    )

    if question_count > 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "Remove or move the questions before "
                "deleting this library"
            ),
        )

    db.delete(bank)
    db.commit()

    return {
        "message": "Question library deleted successfully",
    }