from sqlalchemy import Column, Integer, String

from pydantic import BaseModel, Field

from src.models import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    login = Column(String(20), nullable=False)


class UserInDB(User):
    hashed_password = Column(String, nullable=False)


class UserBase(BaseModel):
    login: str = Field(min_length=4, max_length=20)
    password: str = Field(min_length=6, max_length=32)


class UserCreate(UserBase):
    pass
