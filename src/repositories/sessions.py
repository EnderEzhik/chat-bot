import uuid
from fastapi import HTTPException

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.session import Session, SessionCreate
from src.repositories.users import get_user


async def get_session(session: AsyncSession, session_id: str) -> Session:
    session = await session.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


async def create_session(session: AsyncSession, user_id: int) -> Session:
    _ = await get_user(session, user_id)
    new_session = Session(user_id=user_id)
    guid = str(uuid.uuid4())
    new_session.id = guid
    session.add(new_session)
    await session.commit()
    await session.refresh(new_session)
    return new_session
