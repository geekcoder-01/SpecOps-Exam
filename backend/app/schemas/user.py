from typing import Optional

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
    model_validator,
)


SUPPORTED_USER_STATUSES = {
    "pending",
    "approved",
    "rejected",
    "suspended",
}


class UserRegister(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=100,
    )

    email: EmailStr

    password: str = Field(
        min_length=6,
        max_length=128,
    )

    role: str

    @model_validator(mode="after")
    def validate_registration(self):
        self.name = self.name.strip()
        self.role = self.role.strip().title()

        if self.role.lower() not in {
            "student",
            "examiner",
        }:
            raise ValueError(
                "Only Student and Examiner can register"
            )

        return self


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserStatusUpdate(BaseModel):
    status: str
    reason: Optional[str] = None

    @model_validator(mode="after")
    def validate_status(self):
        self.status = self.status.strip().lower()

        if self.status not in SUPPORTED_USER_STATUSES:
            raise ValueError(
                "Status must be pending, approved, "
                "rejected, or suspended"
            )

        if self.reason:
            self.reason = self.reason.strip() or None

        if (
            self.status == "rejected"
            and not self.reason
        ):
            raise ValueError(
                "A rejection reason is required"
            )

        return self


class UserResponse(BaseModel):
    user_id: int
    name: str
    email: EmailStr
    role: str
    roll: str
    status: str

    phone: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[str] = None
    designation: Optional[str] = None

    class Config:
        from_attributes = True