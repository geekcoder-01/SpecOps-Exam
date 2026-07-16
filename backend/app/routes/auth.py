from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
from sqlalchemy.orm import Session

from app.auth.security import (
    create_access_token,
    hash_password,
    verify_access_token,
    verify_password,
)
from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    UserLogin,
    UserRegister,
)

router = APIRouter()
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db: Session = Depends(get_db),
):
    token = credentials.credentials
    payload = verify_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )

    email = payload.get("sub")

    if not email:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token",
        )

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    status = (
        user.status or "pending"
    ).lower()

    if status != "approved":
        raise_account_status_error(status)

    return user


def require_role(required_role: str):
    def role_checker(
        current_user: User = Depends(
            get_current_user
        ),
    ):
        if (
            current_user.role.lower()
            != required_role.lower()
        ):
            raise HTTPException(
                status_code=403,
                detail="Access denied",
            )

        return current_user

    return role_checker


def raise_account_status_error(status: str):
    messages = {
        "pending": (
            "Your account is awaiting administrator "
            "approval."
        ),
        "rejected": (
            "Your account registration was rejected. "
            "Please contact the administrator."
        ),
        "suspended": (
            "Your account has been suspended. "
            "Please contact the administrator."
        ),
    }

    raise HTTPException(
        status_code=403,
        detail=messages.get(
            status,
            "Your account is not active.",
        ),
    )


def generate_roll_number(
    role: str,
    db: Session,
) -> str:
    prefix = (
        "STU"
        if role.lower() == "student"
        else "EXM"
    )

    existing_count = (
        db.query(User)
        .filter(User.role.ilike(role))
        .count()
    )

    sequence = existing_count + 1

    while True:
        generated_roll = (
            f"{prefix}-{sequence:04d}"
        )

        exists = (
            db.query(User)
            .filter(User.roll == generated_roll)
            .first()
        )

        if not exists:
            return generated_roll

        sequence += 1


@router.post(
    "/register",
    status_code=201,
)
def register(
    user: UserRegister,
    db: Session = Depends(get_db),
):
    normalized_email = (
        str(user.email).strip().lower()
    )

    existing_user = (
        db.query(User)
        .filter(User.email == normalized_email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    role = user.role.strip().title()

    generated_roll = generate_roll_number(
        role=role,
        db=db,
    )

    new_user = User(
        name=user.name.strip(),
        email=normalized_email,
        password=hash_password(user.password),
        role=role,
        roll=generated_roll,
        status="pending",
        approved_by=None,
        approved_at=None,
        rejection_reason=None,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": (
            "Registration successful. Your account "
            "is awaiting administrator approval."
        ),
        "generated_id": generated_roll,
        "status": new_user.status,
        "role": new_user.role,
    }


@router.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db),
):
    normalized_email = (
        str(user.email).strip().lower()
    )

    db_user = (
        db.query(User)
        .filter(User.email == normalized_email)
        .first()
    )

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if not verify_password(
        user.password,
        db_user.password,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    status = (
        db_user.status or "pending"
    ).lower()

    if status != "approved":
        raise_account_status_error(status)

    access_token = create_access_token(
        data={
            "sub": db_user.email,
            "role": db_user.role,
            "user_id": db_user.user_id,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": db_user.role,
        "status": db_user.status,
    }


@router.get("/me")
def me(
    current_user: User = Depends(
        get_current_user
    ),
):
    return {
        "user_id": current_user.user_id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "roll": current_user.roll,
        "status": current_user.status,
        "phone": current_user.phone,
        "department": current_user.department,
        "semester": current_user.semester,
        "designation": current_user.designation,
        "profile_image": current_user.profile_image,
    }


@router.get("/student/dashboard")
def student_dashboard(
    current_user: User = Depends(
        require_role("Student")
    ),
):
    return {
        "message": (
            f"Welcome Student {current_user.name}"
        )
    }


@router.get("/examiner/dashboard")
def examiner_dashboard(
    current_user: User = Depends(
        require_role("Examiner")
    ),
):
    return {
        "message": (
            f"Welcome Examiner {current_user.name}"
        )
    }


@router.get("/admin/dashboard")
def admin_dashboard(
    current_user: User = Depends(
        require_role("Admin")
    ),
):
    return {
        "message": (
            f"Welcome Admin {current_user.name}"
        )
    }