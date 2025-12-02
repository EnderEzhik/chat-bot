from sqlalchemy import Column, Integer, String

from pydantic import BaseModel, Field

from src.models import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    login = Column(String(20), nullable=False)
    password = Column(String(32), default="DefaultPassword", nullable=False) #TODO: Пожалуйста, не забудь это удалить =)


class UserBase(BaseModel):
    login: str = Field(min_length=4, max_length=20)
    password: str = Field(min_length=6, max_length=32, default="DefaultPassword") #TODO: Это тоже =)


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    pass
