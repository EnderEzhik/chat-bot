from src.models import Base

from sqlalchemy import Column, Integer, String


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(20), nullable=False, unique=True)
    hashed_password = Column(String, nullable=False)


from pydantic import BaseModel, Field


class UserBase(BaseModel):
    username: str = Field(..., min_length=4, max_length=20)
    password: str = Field(..., min_length=6, max_length=32)


class UserCreate(UserBase):
    pass


class UserLogin(UserBase):
    pass
