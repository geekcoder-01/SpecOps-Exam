from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routes.auth import require_role
from app.schemas.user import UserStatusUpdate

router = APIRouter()


def serialize_user(user: User):
    return {
        "user_id": user.user_id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "roll": user.roll,
        "status": user.status,
        "phone": user.phone,
        "department": user.department,
        "semester": user.semester,
        "designation": user.designation,
        "profile_image": user.profile_image,
        "approved_by": user.approved_by,
        "approved_at": user.approved_at,
        "rejection_reason":
            user.rejection_reason,
        "created_at": user.created_at,
    }


def get_user_or_404(
    user_id: int,
    db: Session,
):
    user = (
        db.query(User)
        .filter(User.user_id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    return user


@router.get("/students")
def get_all_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("Examiner")
    ),
):
    students = (
        db.query(User)
        .filter(
            func.lower(User.role) == "student",
            User.status == "approved",
        )
        .order_by(User.name.asc())
        .all()
    )

    return [
        serialize_user(student)
        for student in students
    ]


@router.get("/pending")
def get_pending_users(
    role: str | None = Query(
        default=None,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("Admin")
    ),
):
    query = (
        db.query(User)
        .filter(User.status == "pending")
    )

    if role:
        normalized_role = role.strip().lower()

        if normalized_role not in {
            "student",
            "examiner",
        }:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Role must be Student or Examiner"
                ),
            )

        query = query.filter(
            func.lower(User.role)
            == normalized_role
        )

    users = (
        query.order_by(
            User.created_at.asc()
        )
        .all()
    )

    return [
        serialize_user(user)
        for user in users
    ]


@router.get("/all")
def get_all_users(
    role: str | None = Query(
        default=None,
    ),
    status: str | None = Query(
        default=None,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("Admin")
    ),
):
    query = db.query(User)

    if role:
        query = query.filter(
            func.lower(User.role)
            == role.strip().lower()
        )

    if status:
        query = query.filter(
            func.lower(User.status)
            == status.strip().lower()
        )

    users = (
        query.order_by(
            User.created_at.desc()
        )
        .all()
    )

    return [
        serialize_user(user)
        for user in users
    ]


@router.get("/{user_id}")
def get_user_details(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("Admin")
    ),
):
    user = get_user_or_404(
        user_id=user_id,
        db=db,
    )

    return serialize_user(user)


@router.patch("/{user_id}/status")
def update_user_status(
    user_id: int,
    data: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("Admin")
    ),
):
    user = get_user_or_404(
        user_id=user_id,
        db=db,
    )

    if user.user_id == current_user.user_id:
        raise HTTPException(
            status_code=400,
            detail=(
                "You cannot change your own account status"
            ),
        )

    if user.role.lower() == "admin":
        raise HTTPException(
            status_code=403,
            detail=(
                "Admin account status cannot be changed "
                "through this endpoint"
            ),
        )

    user.status = data.status

    if data.status == "approved":
        user.approved_by = current_user.user_id
        user.approved_at = datetime.utcnow()
        user.rejection_reason = None

    elif data.status == "rejected":
        user.approved_by = current_user.user_id
        user.approved_at = None
        user.rejection_reason = data.reason

    elif data.status == "suspended":
        user.approved_by = current_user.user_id
        user.rejection_reason = (
            data.reason
            or "Account suspended by administrator"
        )

    elif data.status == "pending":
        user.approved_by = None
        user.approved_at = None
        user.rejection_reason = None

    db.commit()
    db.refresh(user)

    action_messages = {
        "approved": "User approved successfully",
        "rejected": "User rejected successfully",
        "suspended": "User suspended successfully",
        "pending": (
            "User returned to pending approval"
        ),
    }

    return {
        "message": action_messages[data.status],
        "user": serialize_user(user),
    }