from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.message import Message, MessageCreate


async def save_message(session: AsyncSession, message_create: MessageCreate):
    new_message = Message(**message_create.model_dump())
    session.add(new_message)
    await session.commit()


async def get_messages_by_session_id(session: AsyncSession, session_id: str):
    result = await session.execute(select(Message).where(Message.session_id == session_id))
    messages = result.scalars().all()
    return messages
