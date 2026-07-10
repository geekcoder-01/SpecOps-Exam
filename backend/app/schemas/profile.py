from pydantic import BaseModel
from typing import Optional


class ProfileUpdate(BaseModel):
    name: str
    phone: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[str] = None
    designation: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str