from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.security import get_password_hash, verify_password
from src.models.user import User, UserCreate, UserUpdate


async def create_user(session: AsyncSession, user_create: UserCreate) -> User:
    user_data = user_create.model_dump(exclude={"password"})
    hashed_password = get_password_hash(user_create.password)
    new_user = User(**user_data, hashed_password=hashed_password)
    session.add(new_user)
    await session.commit()
    return new_user


async def update_user(session: AsyncSession, user_db: User, user_update: UserUpdate) -> User:
    user_data = user_update.model_dump(exclude_unset=True)
    if "password" in user_data:
        new_password = user_data.pop("password")
        user_db.hashed_password = get_password_hash(new_password)
    for key, value in user_data.items():
        setattr(user_db, key, value)

    session.add(user_db)
    await session.commit()
    return user_db


async def get_user_by_username(session: AsyncSession, username: str) -> User | None:
    query = select(User).where(User.username == username)
    result = await session.execute(query)
    user = result.scalar_one_or_none()
    return user


async def get_user_by_id(session: AsyncSession, user_id: int) -> User | None:
    user = await session.get(User, user_id)
    return user


async def authenticate(session: AsyncSession, username: str, password: str) -> User | None:
    user = await get_user_by_username(session, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
