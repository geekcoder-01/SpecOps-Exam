from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from app.database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)

    name = Column(String(100), nullable=False)

    email = Column(String(100), unique=True, nullable=False)

    password = Column(String(255), nullable=False)

    role = Column(String(20), nullable=False)

    roll = Column(String(30), unique=True, nullable=False)

    phone = Column(String(20), nullable=True)

    department = Column(String(100), nullable=True)

    semester = Column(String(50), nullable=True)

    designation = Column(String(100), nullable=True)

    profile_image = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)