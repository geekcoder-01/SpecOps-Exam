from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.question_bank_set import QuestionBankSet
from app.models.question_library_member import QuestionLibraryMember
from app.models.user import User


def get_library_or_404(
    bank_id: int,
    db: Session,
) -> QuestionBankSet:
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

    return library


def get_library_membership(
    bank_id: int,
    examiner_id: int,
    db: Session,
):
    return (
        db.query(QuestionLibraryMember)
        .filter(
            QuestionLibraryMember.bank_id == bank_id,
            QuestionLibraryMember.examiner_id == examiner_id,
        )
        .first()
    )


def require_library_access(
    bank_id: int,
    current_user: User,
    db: Session,
) -> QuestionBankSet:
    library = get_library_or_404(bank_id, db)

    if library.created_by == current_user.user_id:
        return library

    membership = get_library_membership(
        bank_id=bank_id,
        examiner_id=current_user.user_id,
        db=db,
    )

    if membership:
        return library

    raise HTTPException(
        status_code=403,
        detail="You do not have access to this question library",
    )


def require_library_edit_access(
    bank_id: int,
    current_user: User,
    db: Session,
) -> QuestionBankSet:
    library = get_library_or_404(bank_id, db)

    if library.created_by == current_user.user_id:
        return library

    membership = get_library_membership(
        bank_id=bank_id,
        examiner_id=current_user.user_id,
        db=db,
    )

    if membership and membership.permission == "editor":
        return library

    raise HTTPException(
        status_code=403,
        detail="You do not have permission to modify this library",
    )


def require_library_owner(
    bank_id: int,
    current_user: User,
    db: Session,
) -> QuestionBankSet:
    library = get_library_or_404(bank_id, db)

    if library.created_by != current_user.user_id:
        raise HTTPException(
            status_code=403,
            detail="Only the library owner can perform this action",
        )

    return library