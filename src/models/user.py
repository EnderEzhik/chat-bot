from sqlalchemy import Column, Integer, String

from pydantic import BaseModel, ConfigDict, Field

from src.models import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(20), nullable=False, unique=True)
    hashed_password = Column(String(256), nullable=False)


class UserBase(BaseModel):
    username: str = Field(..., min_length=4, max_length=20)


class UserCreate(UserBase):
    password: str | None = Field(default=None, min_length=6, max_length=32)


class UserUpdate(UserBase):
    username: str | None = Field(default=None, min_length=4, max_length=20)
    password: str | None = Field(default=None, min_length=6, max_length=32)


class UserOut(UserBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
