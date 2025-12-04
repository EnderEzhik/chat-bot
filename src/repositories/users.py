from fastapi import HTTPException

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.user import User, UserCreate, UserInDB
from src.core.security import get_password_hash


async def is_login_free(session: AsyncSession, new_login: str) -> bool:
    result = await session.execute(select(User).where(User.login == new_login))
    return result.scalar_one_or_none() is None


async def get_user(session: AsyncSession, username: str) -> UserInDB | None:
    result = await session.execute(select(UserInDB).where(UserInDB.login == username))
    user = result.scalar_one_or_none()
    return user


async def create_user(session: AsyncSession, user_create: UserCreate) -> UserInDB:
    login_is_free = await is_login_free(session, user_create.login)
    if not login_is_free:
        raise HTTPException(status_code=400, detail=f"Login \"{user_create.login}\" is already in use")

    hashed_password = get_password_hash(user_create.password)
    new_user = UserInDB(login=user_create.login, hashed_password=hashed_password)
    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)
    return new_user
