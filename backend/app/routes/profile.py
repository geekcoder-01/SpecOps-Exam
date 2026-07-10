from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routes.auth import get_current_user
from app.schemas.profile import ProfileUpdate, PasswordChange
from app.auth.security import verify_password, hash_password

router = APIRouter(
    prefix="/profile",
    tags=["Profile"]
)


@router.get("/me")
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/update")
def update_profile(
    profile: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    current_user.name = profile.name
    current_user.phone = profile.phone
    current_user.department = profile.department

    if current_user.role.lower() == "student":
        current_user.semester = profile.semester

    if current_user.role.lower() == "examiner":
        current_user.designation = profile.designation

    db.commit()
    db.refresh(current_user)

    return {
        "message": "Profile updated successfully"
    }


@router.put("/change-password")
def change_password(
    password: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    if not verify_password(
        password.current_password,
        current_user.password,
    ):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect",
        )

    current_user.password = hash_password(
        password.new_password
    )

    db.commit()

    return {
        "message": "Password changed successfully"
    }