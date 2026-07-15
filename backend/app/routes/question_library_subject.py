from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.question import Question
from app.models.question_library_subject import QuestionLibrarySubject
from app.models.user import User
from app.routes.auth import require_role
from app.schemas.question_library_subject import (
    LibrarySubjectCreate,
    LibrarySubjectUpdate,
)
from app.services.question_library_access import (
    require_library_access,
    require_library_edit_access,
)

router = APIRouter()


@router.post("/{bank_id}/subjects", status_code=201)
def add_library_subject(
    bank_id: int,
    data: LibrarySubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    require_library_edit_access(
        bank_id=bank_id,
        current_user=current_user,
        db=db,
    )

    subject_name = data.subject_name.strip()

    existing = (
        db.query(QuestionLibrarySubject)
        .filter(
            QuestionLibrarySubject.bank_id == bank_id,
            func.lower(QuestionLibrarySubject.subject_name)
            == subject_name.lower(),
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="This subject already exists in the library",
        )

    subject = QuestionLibrarySubject(
        bank_id=bank_id,
        subject_name=subject_name,
    )

    db.add(subject)
    db.commit()
    db.refresh(subject)

    return subject


@router.get("/{bank_id}/subjects")
def get_library_subjects(
    bank_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    require_library_access(
        bank_id=bank_id,
        current_user=current_user,
        db=db,
    )

    records = (
        db.query(
            QuestionLibrarySubject,
            func.count(
                Question.questionbank_id
            ).label("question_count"),
        )
        .outerjoin(
            Question,
            Question.library_subject_id
            == QuestionLibrarySubject.library_subject_id,
        )
        .filter(
            QuestionLibrarySubject.bank_id == bank_id
        )
        .group_by(
            QuestionLibrarySubject.library_subject_id
        )
        .order_by(
            QuestionLibrarySubject.subject_name.asc()
        )
        .all()
    )

    return [
        {
            "library_subject_id":
                subject.library_subject_id,
            "bank_id": subject.bank_id,
            "subject_name": subject.subject_name,
            "question_count": question_count,
        }
        for subject, question_count in records
    ]


@router.put("/subjects/{library_subject_id}")
def update_library_subject(
    library_subject_id: int,
    data: LibrarySubjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    subject = (
        db.query(QuestionLibrarySubject)
        .filter(
            QuestionLibrarySubject.library_subject_id
            == library_subject_id
        )
        .first()
    )

    if not subject:
        raise HTTPException(
            status_code=404,
            detail="Library subject not found",
        )

    require_library_edit_access(
        bank_id=subject.bank_id,
        current_user=current_user,
        db=db,
    )

    new_name = data.subject_name.strip()

    duplicate = (
        db.query(QuestionLibrarySubject)
        .filter(
            QuestionLibrarySubject.bank_id
            == subject.bank_id,
            func.lower(
                QuestionLibrarySubject.subject_name
            )
            == new_name.lower(),
            QuestionLibrarySubject.library_subject_id
            != library_subject_id,
        )
        .first()
    )

    if duplicate:
        raise HTTPException(
            status_code=400,
            detail="This subject already exists in the library",
        )

    subject.subject_name = new_name

    db.query(Question).filter(
        Question.library_subject_id
        == library_subject_id
    ).update(
        {"subject": new_name},
        synchronize_session=False,
    )

    db.commit()
    db.refresh(subject)

    return subject


@router.delete("/subjects/{library_subject_id}")
def delete_library_subject(
    library_subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    subject = (
        db.query(QuestionLibrarySubject)
        .filter(
            QuestionLibrarySubject.library_subject_id
            == library_subject_id
        )
        .first()
    )

    if not subject:
        raise HTTPException(
            status_code=404,
            detail="Library subject not found",
        )

    require_library_edit_access(
        bank_id=subject.bank_id,
        current_user=current_user,
        db=db,
    )

    question_count = (
        db.query(func.count(Question.questionbank_id))
        .filter(
            Question.library_subject_id
            == library_subject_id
        )
        .scalar()
        or 0
    )

    if question_count > 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "Move or delete the questions before "
                "deleting this subject"
            ),
        )

    db.delete(subject)
    db.commit()

    return {
        "message": "Library subject deleted successfully",
    }