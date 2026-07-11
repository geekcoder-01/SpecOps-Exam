from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.draft_question import DraftQuestion
from app.models.question import Question
from app.models.question_bank_set import QuestionBankSet
from app.models.question_library_subject import QuestionLibrarySubject
from app.models.user import User
from app.routes.auth import require_role
from app.schemas.draft_question import (
    DraftQuestionCreate,
    DraftQuestionResponse,
    DraftQuestionUpdate,
)

router = APIRouter()


SUPPORTED_SOURCE_TYPES = {
    "import",
    "ai_generated",
    "manual",
}

SUPPORTED_STATUSES = {
    "pending",
    "approved",
    "rejected",
}

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


def validate_library_subject(
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

    subject = (
        db.query(QuestionLibrarySubject)
        .filter(
            QuestionLibrarySubject.library_subject_id
            == library_subject_id,
            QuestionLibrarySubject.bank_id == bank_id,
        )
        .first()
    )

    if not subject:
        raise HTTPException(
            status_code=400,
            detail="The selected subject does not belong to this library",
        )

    return subject


def validate_question_type(question_type: str):
    normalized = question_type.strip().lower()

    if normalized not in SUPPORTED_QUESTION_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported question type",
        )

    return normalized


@router.post(
    "/create",
    response_model=DraftQuestionResponse,
    status_code=201,
)
def create_draft_question(
    data: DraftQuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    source_type = data.source_type.strip().lower()

    if source_type not in SUPPORTED_SOURCE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported source type",
        )

    question_type = validate_question_type(
        data.question_type
    )

    validate_library_subject(
        bank_id=data.bank_id,
        library_subject_id=data.library_subject_id,
        db=db,
    )

    draft = DraftQuestion(
        bank_id=data.bank_id,
        library_subject_id=data.library_subject_id,
        import_id=data.import_id,
        created_by=current_user.user_id,
        source_type=source_type,
        question_text=data.question_text.strip(),
        question_type=question_type,
        option_a=data.option_a.strip() if data.option_a else None,
        option_b=data.option_b.strip() if data.option_b else None,
        option_c=data.option_c.strip() if data.option_c else None,
        option_d=data.option_d.strip() if data.option_d else None,
        correct_answer=(
            data.correct_answer.strip()
            if data.correct_answer
            else None
        ),
        marks=data.marks,
        difficulty_level=data.difficulty_level.strip().title(),
        confidence_score=data.confidence_score,
        status="pending",
    )

    db.add(draft)
    db.commit()
    db.refresh(draft)

    return draft


@router.get(
    "/library/{bank_id}",
    response_model=list[DraftQuestionResponse],
)
def get_library_drafts(
    bank_id: int,
    status: str = "pending",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    if status not in SUPPORTED_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported draft status",
        )

    return (
        db.query(DraftQuestion)
        .filter(
            DraftQuestion.bank_id == bank_id,
            DraftQuestion.status == status,
        )
        .order_by(DraftQuestion.draft_id.desc())
        .all()
    )


@router.get(
    "/{draft_id}",
    response_model=DraftQuestionResponse,
)
def get_draft_question(
    draft_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    draft = (
        db.query(DraftQuestion)
        .filter(DraftQuestion.draft_id == draft_id)
        .first()
    )

    if not draft:
        raise HTTPException(
            status_code=404,
            detail="Draft question not found",
        )

    return draft


@router.put(
    "/{draft_id}",
    response_model=DraftQuestionResponse,
)
def update_draft_question(
    draft_id: int,
    data: DraftQuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    draft = (
        db.query(DraftQuestion)
        .filter(DraftQuestion.draft_id == draft_id)
        .first()
    )

    if not draft:
        raise HTTPException(
            status_code=404,
            detail="Draft question not found",
        )

    if draft.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending drafts can be edited",
        )

    draft.question_text = data.question_text.strip()
    draft.question_type = validate_question_type(
        data.question_type
    )

    draft.option_a = (
        data.option_a.strip()
        if data.option_a
        else None
    )
    draft.option_b = (
        data.option_b.strip()
        if data.option_b
        else None
    )
    draft.option_c = (
        data.option_c.strip()
        if data.option_c
        else None
    )
    draft.option_d = (
        data.option_d.strip()
        if data.option_d
        else None
    )

    draft.correct_answer = (
        data.correct_answer.strip()
        if data.correct_answer
        else None
    )

    draft.marks = data.marks
    draft.difficulty_level = (
        data.difficulty_level.strip().title()
    )
    draft.confidence_score = data.confidence_score
    draft.review_notes = (
        data.review_notes.strip()
        if data.review_notes
        else None
    )

    db.commit()
    db.refresh(draft)

    return draft


@router.post(
    "/{draft_id}/approve",
    response_model=DraftQuestionResponse,
)
def approve_draft_question(
    draft_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    draft = (
        db.query(DraftQuestion)
        .filter(DraftQuestion.draft_id == draft_id)
        .first()
    )

    if not draft:
        raise HTTPException(
            status_code=404,
            detail="Draft question not found",
        )

    if draft.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending drafts can be approved",
        )

    subject = validate_library_subject(
        bank_id=draft.bank_id,
        library_subject_id=draft.library_subject_id,
        db=db,
    )

    question = Question(
        bank_id=draft.bank_id,
        library_subject_id=draft.library_subject_id,
        question_text=draft.question_text,
        question_type=draft.question_type,
        option_a=draft.option_a,
        option_b=draft.option_b,
        option_c=draft.option_c,
        option_d=draft.option_d,
        correct_answer=draft.correct_answer,
        marks=draft.marks,
        difficulty_level=draft.difficulty_level,
        subject=subject.subject_name,
    )

    db.add(question)

    draft.status = "approved"

    db.commit()
    db.refresh(draft)

    return draft


@router.post(
    "/{draft_id}/reject",
    response_model=DraftQuestionResponse,
)
def reject_draft_question(
    draft_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    draft = (
        db.query(DraftQuestion)
        .filter(DraftQuestion.draft_id == draft_id)
        .first()
    )

    if not draft:
        raise HTTPException(
            status_code=404,
            detail="Draft question not found",
        )

    if draft.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending drafts can be rejected",
        )

    draft.status = "rejected"

    db.commit()
    db.refresh(draft)

    return draft


@router.delete("/{draft_id}")
def delete_draft_question(
    draft_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    draft = (
        db.query(DraftQuestion)
        .filter(DraftQuestion.draft_id == draft_id)
        .first()
    )

    if not draft:
        raise HTTPException(
            status_code=404,
            detail="Draft question not found",
        )

    if draft.status == "approved":
        raise HTTPException(
            status_code=400,
            detail="Approved drafts cannot be deleted",
        )

    db.delete(draft)
    db.commit()

    return {
        "message": "Draft question deleted successfully",
    }