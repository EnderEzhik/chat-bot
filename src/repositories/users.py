from fastapi import HTTPException

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.user import User, UserCreate, User
from src.core.security import get_password_hash


async def is_username_free(session: AsyncSession, new_username: str) -> bool:
    result = await session.execute(select(User).where(User.username == new_username))
    return result.scalar_one_or_none() is None


async def get_user(session: AsyncSession, user_id: int) -> User:
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


async def get_user_by_username(session: AsyncSession, username: str) -> User | None:
    user = (await session.execute(select(User).where(User.username == username))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


async def create_user(session: AsyncSession, user_create: UserCreate) -> User:
    username_is_free = await is_username_free(session, user_create.username)
    if not username_is_free:
        raise HTTPException(status_code=400, detail=f"Username is already in use")

    hashed_password = get_password_hash(user_create.password)
    new_user = User(username=user_create.username, hashed_password=hashed_password)
    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)
    return new_user
