from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin
from app.auth.security import (
    hash_password,
    verify_password,
    create_access_token,
    verify_access_token
)

router = APIRouter()
security = HTTPBearer()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    payload = verify_access_token(token)

    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or Expired Token")

    email = payload.get("sub")
    user = db.query(User).filter(User.email == email).first()

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return user


def require_role(required_role: str):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role.lower() != required_role.lower():
            raise HTTPException(status_code=403, detail="Access Denied")
        return current_user

    return role_checker


@router.post("/register")
def register(user: UserRegister, db: Session = Depends(get_db)):

    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    role_lower = user.role.lower()

    if role_lower == "student":
        prefix = "STU"
    elif role_lower == "examiner":
        prefix = "EXM"
    else:
        raise HTTPException(
            status_code=400,
            detail="Only Student and Examiner can register"
        )

    user_count = db.query(User).filter(User.role.ilike(user.role)).count()
    generated_roll = f"{prefix}-{user_count + 1:04d}"

    new_user = User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password),
        role=user.role,
        roll=generated_roll
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User Registered Successfully",
        "generated_id": generated_roll
    }


@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):

    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid Email or Password")

    if not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid Email or Password")

    access_token = create_access_token(
        data={
            "sub": db_user.email,
            "role": db_user.role
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {
        "user_id": current_user.user_id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "roll": current_user.roll
    }


@router.get("/student/dashboard")
def student_dashboard(current_user: User = Depends(require_role("Student"))):
    return {"message": f"Welcome Student {current_user.name}"}


@router.get("/examiner/dashboard")
def examiner_dashboard(current_user: User = Depends(require_role("Examiner"))):
    return {"message": f"Welcome Examiner {current_user.name}"}


@router.get("/admin/dashboard")
def admin_dashboard(current_user: User = Depends(require_role("Admin"))):
    return {"message": f"Welcome Admin {current_user.name}"}