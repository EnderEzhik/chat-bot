from sqlalchemy.ext.asyncio import AsyncSession

from src.models.user import User, UserCreate, UserUpdate


async def create_user(session: AsyncSession, user_create: UserCreate) -> User:
    user_data = user_create.model_dump()
    new_user = User(**user_data)
    session.add(new_user)
    await session.commit()
    return new_user
