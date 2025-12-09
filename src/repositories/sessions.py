import uuid
from fastapi import HTTPException

from sqlalchemy.ext.asyncio import AsyncSession

from src.models.session import Session
from src.repositories.users import get_user_by_id


async def get_session(session: AsyncSession, session_id: str) -> Session:
    session = await session.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


async def create_session(session: AsyncSession, user_id: int) -> Session:
    new_session = Session(user_id=user_id)
    new_session.id = str(uuid.uuid4())
    session.add(new_session)
    await session.commit()
    return new_session
