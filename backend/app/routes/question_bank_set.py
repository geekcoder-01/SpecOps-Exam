from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.question import Question
from app.models.question_bank_set import QuestionBankSet
from app.models.question_library_member import QuestionLibraryMember
from app.models.user import User
from app.routes.auth import require_role
from app.schemas.question_bank_set import (
    QuestionBankSetCreate,
    QuestionBankSetUpdate,
)
from app.schemas.question_library_member import LibraryMemberAdd
from app.services.question_library_access import (
    require_library_access,
    require_library_edit_access,
    require_library_owner,
)

router = APIRouter()


def serialize_bank(
    bank: QuestionBankSet,
    question_count: int = 0,
    current_user_id: int | None = None,
    permission: str | None = None,
):
    is_owner = (
        current_user_id is not None
        and bank.created_by == current_user_id
    )

    return {
        "bank_id": bank.bank_id,
        "title": bank.title,
        "purpose": bank.purpose,
        "question_count": question_count or 0,
        "created_by": bank.created_by,
        "visibility": bank.visibility,
        "is_owner": is_owner,
        "permission": "owner" if is_owner else permission,
    }


@router.get("/available-examiners")
def get_available_examiners(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    examiners = (
        db.query(User)
        .filter(
            func.lower(User.role) == "examiner",
            User.user_id != current_user.user_id,
        )
        .order_by(User.name.asc())
        .all()
    )

    return [
        {
            "user_id": examiner.user_id,
            "name": examiner.name,
            "email": examiner.email,
            "designation": examiner.designation,
            "department": examiner.department,
        }
        for examiner in examiners
    ]


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
            QuestionBankSet.created_by == current_user.user_id,
            func.lower(QuestionBankSet.title) == title.lower(),
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="You already have a library with this title",
        )

    bank = QuestionBankSet(
        title=title,
        subject=None,
        purpose=(
            data.purpose.strip()
            if data.purpose and data.purpose.strip()
            else None
        ),
        created_by=current_user.user_id,
        visibility="private",
    )

    db.add(bank)
    db.commit()
    db.refresh(bank)

    return serialize_bank(
        bank,
        current_user_id=current_user.user_id,
    )


@router.get("/all")
def get_all_question_libraries(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    records = (
        db.query(
            QuestionBankSet,
            func.count(
                func.distinct(Question.questionbank_id)
            ).label("question_count"),
            QuestionLibraryMember.permission,
        )
        .outerjoin(
            Question,
            Question.bank_id == QuestionBankSet.bank_id,
        )
        .outerjoin(
            QuestionLibraryMember,
            (
                QuestionLibraryMember.bank_id
                == QuestionBankSet.bank_id
            )
            & (
                QuestionLibraryMember.examiner_id
                == current_user.user_id
            ),
        )
        .filter(
            or_(
                QuestionBankSet.created_by
                == current_user.user_id,
                QuestionLibraryMember.examiner_id
                == current_user.user_id,
            )
        )
        .group_by(
            QuestionBankSet.bank_id,
            QuestionLibraryMember.permission,
        )
        .order_by(QuestionBankSet.bank_id.desc())
        .all()
    )

    return [
        serialize_bank(
            bank=bank,
            question_count=question_count,
            current_user_id=current_user.user_id,
            permission=permission,
        )
        for bank, question_count, permission in records
    ]


@router.get("/{bank_id}")
def get_question_library(
    bank_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    bank = require_library_access(
        bank_id=bank_id,
        current_user=current_user,
        db=db,
    )

    membership = (
        db.query(QuestionLibraryMember)
        .filter(
            QuestionLibraryMember.bank_id == bank_id,
            QuestionLibraryMember.examiner_id
            == current_user.user_id,
        )
        .first()
    )

    question_count = (
        db.query(func.count(Question.questionbank_id))
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
        **serialize_bank(
            bank=bank,
            question_count=question_count,
            current_user_id=current_user.user_id,
            permission=(
                membership.permission
                if membership
                else None
            ),
        ),
        "questions": questions,
    }


@router.put("/{bank_id}")
def update_question_library(
    bank_id: int,
    data: QuestionBankSetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    bank = require_library_edit_access(
        bank_id=bank_id,
        current_user=current_user,
        db=db,
    )

    title = data.title.strip()

    duplicate = (
        db.query(QuestionBankSet)
        .filter(
            QuestionBankSet.created_by == bank.created_by,
            func.lower(QuestionBankSet.title)
            == title.lower(),
            QuestionBankSet.bank_id != bank_id,
        )
        .first()
    )

    if duplicate:
        raise HTTPException(
            status_code=400,
            detail="The owner already has a library with this title",
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
        db.query(func.count(Question.questionbank_id))
        .filter(Question.bank_id == bank_id)
        .scalar()
        or 0
    )

    return serialize_bank(
        bank=bank,
        question_count=question_count,
        current_user_id=current_user.user_id,
    )


@router.get("/{bank_id}/members")
def get_library_members(
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
        db.query(QuestionLibraryMember, User)
        .join(
            User,
            User.user_id
            == QuestionLibraryMember.examiner_id,
        )
        .filter(QuestionLibraryMember.bank_id == bank_id)
        .order_by(User.name.asc())
        .all()
    )

    return [
        {
            "library_member_id": member.library_member_id,
            "bank_id": member.bank_id,
            "examiner_id": member.examiner_id,
            "name": examiner.name,
            "email": examiner.email,
            "permission": member.permission,
            "added_at": member.added_at,
        }
        for member, examiner in records
    ]


@router.post("/{bank_id}/members", status_code=201)
def add_library_member(
    bank_id: int,
    data: LibraryMemberAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    bank = require_library_owner(
        bank_id=bank_id,
        current_user=current_user,
        db=db,
    )

    if data.examiner_id == current_user.user_id:
        raise HTTPException(
            status_code=400,
            detail="The owner already has full access",
        )

    examiner = (
        db.query(User)
        .filter(
            User.user_id == data.examiner_id,
            func.lower(User.role) == "examiner",
        )
        .first()
    )

    if not examiner:
        raise HTTPException(
            status_code=404,
            detail="Examiner not found",
        )

    permission = data.permission.strip().lower()

    if permission not in {"editor", "viewer"}:
        raise HTTPException(
            status_code=400,
            detail="Permission must be editor or viewer",
        )

    existing = (
        db.query(QuestionLibraryMember)
        .filter(
            QuestionLibraryMember.bank_id == bank_id,
            QuestionLibraryMember.examiner_id
            == data.examiner_id,
        )
        .first()
    )

    if existing:
        existing.permission = permission
        member = existing
    else:
        member = QuestionLibraryMember(
            bank_id=bank_id,
            examiner_id=data.examiner_id,
            permission=permission,
            added_by=current_user.user_id,
        )
        db.add(member)

    bank.visibility = "shared"

    db.commit()
    db.refresh(member)

    return {
        "message": "Library access granted successfully",
        "examiner_id": examiner.user_id,
        "name": examiner.name,
        "email": examiner.email,
        "permission": member.permission,
    }


@router.delete("/{bank_id}/members/{examiner_id}")
def remove_library_member(
    bank_id: int,
    examiner_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    bank = require_library_owner(
        bank_id=bank_id,
        current_user=current_user,
        db=db,
    )

    member = (
        db.query(QuestionLibraryMember)
        .filter(
            QuestionLibraryMember.bank_id == bank_id,
            QuestionLibraryMember.examiner_id == examiner_id,
        )
        .first()
    )

    if not member:
        raise HTTPException(
            status_code=404,
            detail="Library member not found",
        )

    db.delete(member)
    db.flush()

    remaining_members = (
        db.query(QuestionLibraryMember)
        .filter(QuestionLibraryMember.bank_id == bank_id)
        .count()
    )

    if remaining_members == 0:
        bank.visibility = "private"

    db.commit()

    return {
        "message": "Examiner access removed successfully",
    }


@router.delete("/{bank_id}")
def delete_question_library(
    bank_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Examiner")),
):
    bank = require_library_owner(
        bank_id=bank_id,
        current_user=current_user,
        db=db,
    )

    question_count = (
        db.query(func.count(Question.questionbank_id))
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