from datetime import datetime

from src.models import Base

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True)
    session_id = Column(String, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    sender_type = Column(String, nullable=False)
    text = Column(String, nullable=False)
    sent_at = Column(DateTime, default=func.now())


from pydantic import BaseModel, Field
from typing import Literal


class MessageBase(BaseModel):
    sender_type: Literal["user", "bot"]
    text: str = Field(min_length=1)


class MessageCreate(MessageBase):
    session_id: str


class MessageOut(MessageBase):
    sent_at: datetime
